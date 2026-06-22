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
import { buildAndRunSpace, extractSpaceConfig } from '@/lib/docker/buildEngine';
import { getRepo, repoExists } from '@/lib/git/repoManager';
import fs from 'fs';
import path from 'path';

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
    
    // Record build start
    buildResults.set(`${owner}-${spaceSlug}`, {
      spaceId: `${owner}-${spaceSlug}`,
      owner,
      spaceSlug,
      success: false,
      startedAt,
      completedAt: 0
    });
    
    // Extract space config from README.md
    const config = extractSpaceConfig(repoPath);
    
    // Build and run the space
    const result = await buildAndRunSpace(repoPath, owner, spaceSlug);
    
    const completedAt = Date.now();
    
    // Store build result
    const buildResult: BuildResult = {
      spaceId: `${owner}-${spaceSlug}`,
      owner,
      spaceSlug,
      success: result.success,
      container: result.container,
      error: result.error,
      buildLogs: result.buildLogs,
      startedAt,
      completedAt
    };
    
    buildResults.set(`${owner}-${spaceSlug}`, buildResult);
    
    // Return appropriate response
    if (result.success && result.container) {
      return NextResponse.json({
        success: true,
        spaceId: `${owner}-${spaceSlug}`,
        container: {
          id: result.container.containerId,
          name: result.container.containerName,
          port: result.container.port,
          hostPort: result.container.hostPort,
          url: `http://localhost:${result.container.hostPort}`
        },
        message: `Space deployed successfully at port ${result.container.hostPort}`
      });
    } else {
      return NextResponse.json({
        success: false,
        spaceId: `${owner}-${spaceSlug}`,
        error: result.error,
        buildLogs: result.buildLogs,
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
    const { owner, spaceSlug, repoPath } = await request.json();
    
    if (!owner || !spaceSlug) {
      return NextResponse.json(
        { error: 'Missing owner and spaceSlug' },
        { status: 400 }
      );
    }
    
    // Find the repo
    const repo = repoExists(owner, spaceSlug);
    if (!repo) {
      return NextResponse.json(
        { error: `Repository not found for ${owner}/${spaceSlug}` },
        { status: 404 }
      );
    }
    
    // Trigger rebuild
    const result = await buildAndRunSpace(
      path.join(process.cwd(), 'storage', 'repos', owner, spaceSlug),
      owner,
      spaceSlug
    );
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Rebuild triggered',
        container: result.container
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
        logs: result.buildLogs
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
    
    // Extract container name from spaceId
    // Format: coreed-{owner}-{spaceSlug}
    const containerName = `coreed-${spaceId.replace(/^coreed-/, '')}`;
    
    try {
      // Import here to avoid circular dependency
      const { stopContainer, removeContainer } = await import('@/lib/docker/buildEngine');
      
      await stopContainer(containerName);
      await removeContainer(containerName);
      
      return NextResponse.json({
        success: true,
        message: `Space ${spaceId} stopped and removed`
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
