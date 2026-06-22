import { NextResponse } from 'next/server';
import { startSpace, stopSpace, getSpacePort, getRunningSpaces, installDependencies } from '@/lib/spaceRunner';
import { getSpaceById } from '@/lib/spacesStore';
import path from 'path';

export async function POST(request: Request) {
  try {
    const { spaceId, action } = await request.json();

    if (!spaceId || !action) {
      return NextResponse.json({ error: 'spaceId and action are required' }, { status: 400 });
    }

    const storedSpace = getSpaceById(spaceId);
    if (!storedSpace) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    switch (action) {
      case 'start': {
        const result = await startSpace(spaceId, storedSpace.gitRepo.repoPath, storedSpace.sdk);
        if (result.success) {
          const platformDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
          const platformPort = process.env.PORT || 3000;
          const spaceUrl = `http://${platformDomain}:${result.port}`;
          return NextResponse.json({ 
            success: true, 
            port: result.port,
            url: spaceUrl,
            platformUrl: `http://${platformDomain}:${platformPort}/spaces/${spaceId}`
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            error: result.error || 'Failed to start space'
          }, { status: 500 });
        }
      }

      case 'stop': {
        const stopped = stopSpace(spaceId);
        return NextResponse.json({ 
          success: stopped, 
          message: stopped ? 'Space stopped' : 'Space not running'
        });
      }

      case 'install-deps': {
        const result = await installDependencies(storedSpace.gitRepo.repoPath, storedSpace.sdk);
        return NextResponse.json({ 
          success: true, 
          message: result
        });
      }

      case 'restart': {
        stopSpace(spaceId);
        const result = await startSpace(spaceId, storedSpace.gitRepo.repoPath, storedSpace.sdk);
        if (result.success) {
          const platformDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
          const platformPort = process.env.PORT || 3000;
          return NextResponse.json({ 
            success: true, 
            port: result.port,
            url: `http://${platformDomain}:${result.port}`,
            platformUrl: `http://${platformDomain}:${platformPort}/spaces/${spaceId}`
          });
        } else {
          return NextResponse.json({ 
            success: false, 
            error: result.error || 'Failed to restart space'
          }, { status: 500 });
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');

    if (spaceId) {
      const port = getSpacePort(spaceId);
      const storedSpace = getSpaceById(spaceId);
      
      if (!storedSpace) {
        return NextResponse.json({ error: 'Space not found' }, { status: 404 });
      }

      const isRunning = port !== undefined;
      const platformDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';
      const platformPort = process.env.PORT || 3000;

      return NextResponse.json({
        spaceId,
        isRunning,
        port: port || storedSpace.localEndpointUrl?.split(':').pop(),
        url: isRunning ? `http://${platformDomain}:${port}` : storedSpace.localEndpointUrl,
        platformUrl: `http://${platformDomain}:${platformPort}/spaces/${spaceId}`,
        sdk: storedSpace.sdk
      });
    }

    const runningSpaces = getRunningSpaces();
    const spacesList = Array.from(runningSpaces.entries()).map(([spaceId, space]) => ({
      spaceId,
      port: space.port,
      repoPath: space.repoPath,
      sdk: space.sdk
    }));

    return NextResponse.json({
      running: spacesList,
      count: spacesList.length
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
