/**
 * Git Push Webhook Handler
 * 
 * This endpoint is called by the post-receive hook whenever a developer
 * pushes code to their space's Git repository.
 * 
 * Flow:
 * 1. Developer pushes to Coreed's Git repo
 * 2. Post-receive hook fires (installed in repoManager.ts)
 * 3. Hook calls this endpoint with repoPath, owner, space
 * 4. This handler builds and deploys the Docker container
 * 5. Space becomes accessible at http://localhost:{port}
 * 
 * Also integrates with 0G:
 * - Optionally stores repo on 0G Storage
 * - Tracks build history on-chain via AgentSpaceRegistry
 */

import { NextResponse } from 'next/server';
import { getRepo, repoExists } from '@/lib/git/repoManager';
import fs from 'fs';
import path from 'path';
import { zeroGSpaceManager } from '@/lib/zeroGSpaceManager';
import { getSpaceById, addSpace, updateSpaceStatus } from '@/lib/spacesStore';
import { startSpace, stopSpace } from '@/lib/spaceRunner';

/**
 * Build result stored for frontend retrieval
 */
interface BuildResult {
  spaceId: string;
  owner: string;
  spaceSlug: string;
  success: boolean;
  container?: any;
  error?: string;
  buildLogs?: string[];
  startedAt: number;
  completedAt: number;
}

// In-memory store for build results (use DB in production)
const buildResults = new Map<string, BuildResult>();

/**
 * POST /api/webhooks/git-push
 * 
 * Handles git push events from post-receive hooks
 */
export async function POST(request: Request) {
  try {
    const { repoPath, owner, space: spaceSlug } = await request.json();
    
    if (!repoPath || !owner || !spaceSlug) {
      return NextResponse.json(
        { error: 'Missing required fields: repoPath, owner, space' },
        { status: 400 }
      );
    }
    
    // Validate repo exists
    if (!fs.existsSync(repoPath)) {
      return NextResponse.json(
        { error: `Repository not found: ${repoPath}` },
        { status: 404 }
      );
    }
    
    const startedAt = Date.now();
    
    // Stop the currently running space to clear resource/port bindings
    stopSpace(spaceSlug);
    await updateSpaceStatus(spaceSlug, 'created');

    // Record build start
    buildResults.set(`${owner}-${spaceSlug}`, {
      spaceId: `${owner}-${spaceSlug}`,
      owner,
      spaceSlug,
      success: false,
      startedAt,
      completedAt: 0
    });

    // 1. Pack and upload updated codebase to 0G Storage
    let storageRootHash = "";
    let storageTxHash = "";
    try {
      const uploadResult = await zeroGSpaceManager.uploadRepo(repoPath);
      storageRootHash = uploadResult.rootHash;
      storageTxHash = uploadResult.txHash;
    } catch (uploadErr: any) {
      console.error("Failed to upload updated codebase to 0G Storage:", uploadErr);
    }

    // 2. Update local space store metadata
    const storedSpace = await getSpaceById(spaceSlug);
    if (storedSpace) {
      if (storageRootHash) storedSpace.storageRootHash = storageRootHash;
      if (storageTxHash) storedSpace.storageTxHash = storageTxHash;
      await addSpace(storedSpace);
    }

    const sdk = storedSpace?.sdk || 'gradio';

    // 3. Spawning the updated space runner
    const result = await startSpace(spaceSlug, repoPath, sdk);
    if (result.success) {
      await updateSpaceStatus(spaceSlug, 'running');
    } else {
      await updateSpaceStatus(spaceSlug, 'error');
    }

    const completedAt = Date.now();
    
    // Store build result
    const buildResult: BuildResult = {
      spaceId: `${owner}-${spaceSlug}`,
      owner,
      spaceSlug,
      success: result.success,
      container: {
        id: spaceSlug,
        name: spaceSlug,
        port: result.port,
        hostPort: result.port,
        url: `http://localhost:${result.port}`
      },
      error: result.error,
      buildLogs: [`[0G Storage] Uploaded updated codebase to 0G. Root Hash: ${storageRootHash}`, `[0G Compute] Spawning application node...`],
      startedAt,
      completedAt
    };
    
    buildResults.set(`${owner}-${spaceSlug}`, buildResult);
    
    // Return appropriate response
    if (result.success) {
      return NextResponse.json({
        success: true,
        spaceId: `${owner}-${spaceSlug}`,
        container: buildResult.container,
        message: `Space deployed successfully at port ${result.port}`
      });
    } else {
      return NextResponse.json({
        success: false,
        spaceId: `${owner}-${spaceSlug}`,
        error: result.error,
        buildLogs: buildResult.buildLogs,
        message: 'Build failed'
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('Git push webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/webhooks/git-push?spaceId=X
 * 
 * Get build status and logs for a specific space
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('spaceId');
  
  if (!spaceId) {
    return NextResponse.json(
      { error: 'Missing spaceId parameter' },
      { status: 400 }
    );
  }
  
  // Try to extract owner and slug from spaceId
  // spaceId format: "owner-spaceSlug" or just spaceSlug
  const buildResult = buildResults.get(spaceId);
  
  if (!buildResult) {
    // Try to find by owner-space pattern
    const [owner, slug] = spaceId.split('-');
    const alternateKey = owner && slug ? `${owner}-${slug}` : spaceId;
    const alternateResult = buildResults.get(alternateKey);
    
    if (alternateResult) {
      return NextResponse.json(alternateResult);
    }
    
    return NextResponse.json(
      { error: 'Build result not found', spaceId },
      { status: 404 }
    );
  }
  
  return NextResponse.json(buildResult);
}

/**
 * Helper: Manually trigger a rebuild for a space
 */
export async function PUT(request: Request) {
  try {
    const { owner, spaceSlug } = await request.json();
    
    if (!owner || !spaceSlug) {
      return NextResponse.json(
        { error: 'Missing owner and spaceSlug' },
        { status: 400 }
      );
    }
    
    // Find the space
    const storedSpace = await getSpaceById(spaceSlug);
    if (!storedSpace) {
      return NextResponse.json(
        { error: `Space not found: ${spaceSlug}` },
        { status: 404 }
      );
    }
    
    // Stop and restart
    stopSpace(spaceSlug);
    await updateSpaceStatus(spaceSlug, 'created');

    const result = await startSpace(spaceSlug, storedSpace.gitRepo.repoPath, storedSpace.sdk);
    if (result.success) {
      await updateSpaceStatus(spaceSlug, 'running');
      return NextResponse.json({
        success: true,
        message: 'Rebuild triggered successfully',
        port: result.port
      });
    } else {
      await updateSpaceStatus(spaceSlug, 'error');
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 });
    }
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/**
 * Helper: Stop a running space
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');
    
    if (!spaceId) {
      return NextResponse.json(
        { error: 'Missing spaceId parameter' },
        { status: 400 }
      );
    }
    
    try {
      const stopped = stopSpace(spaceId);
      await updateSpaceStatus(spaceId, 'created');
      
      return NextResponse.json({
        success: true,
        message: stopped ? `Space ${spaceId} stopped` : `Space ${spaceId} was not running`
      });
    } catch (err: any) {
      return NextResponse.json({
        success: false,
        error: err.message
      }, { status: 500 });
    }
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
