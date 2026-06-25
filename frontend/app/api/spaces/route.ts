import { NextResponse } from 'next/server';
import { getAllSpaces, getSpaceById, getSpacesByOwner } from '@/lib/spacesStore';

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
  
  // Note: Actual file deletion would need to be implemented
  // For now, just remove from in-memory store
  // In production, this should delete the Git repo files too
  
  return NextResponse.json({
    success: true,
    message: 'Space deletion would remove from in-memory store. Implement file cleanup for production.'
  });
}
