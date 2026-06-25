import { NextResponse } from 'next/server';
import { getAllSpaces, getSpaceById, getSpacesByOwner, deleteSpace } from '@/lib/spacesStore';
import { stopSpace, clearSpaceLogs } from '@/lib/spaceRunner';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/spaces
 * List all spaces or get a specific space by ID
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('spaceId');
  const owner = searchParams.get('owner');
  
  if (spaceId) {
    // Get a specific space by ID
    const space = await getSpaceById(spaceId);
    if (space) {
      return NextResponse.json(space);
    }
    return NextResponse.json({ error: 'Space not found' }, { status: 404 });
  }
  
  if (owner) {
    // Get spaces by owner
    const spaces = await getSpacesByOwner(owner);
    return NextResponse.json({ spaces, count: spaces.length });
  }
  
  // Get all spaces
  const spaces = await getAllSpaces();
  return NextResponse.json({ spaces, count: spaces.length });
}

/**
 * DELETE /api/spaces
 * Delete a space by ID
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('spaceId');
  
  if (!spaceId) {
    return NextResponse.json({ error: 'spaceId parameter is required' }, { status: 400 });
  }
  
  // 1. Stop running child processes
  stopSpace(spaceId);
  
  // 2. Clear log buffers from memory
  clearSpaceLogs(spaceId);
  
  // 3. Clean up directory files
  const computeNodePath = path.join(process.cwd(), 'storage', 'compute-nodes', spaceId);
  if (fs.existsSync(computeNodePath)) {
    try {
      fs.rmSync(computeNodePath, { recursive: true, force: true });
    } catch (err: any) {
      console.error(`Failed to delete compute node path ${computeNodePath}:`, err.message);
    }
  }
  
  // 4. Remove from PostgreSQL/In-memory stores
  const deleted = await deleteSpace(spaceId);
  
  return NextResponse.json({
    success: deleted,
    message: deleted ? 'Space and associated compute resources successfully cleaned up.' : 'Space not found in local registries.'
  });
}
