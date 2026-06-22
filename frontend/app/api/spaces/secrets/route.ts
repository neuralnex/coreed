import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getSpaceById } from '@/lib/spacesStore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('spaceId');

  if (!spaceId) {
    return NextResponse.json({ error: 'spaceId parameter is required' }, { status: 400 });
  }

  const space = getSpaceById(spaceId);
  if (!space) {
    return NextResponse.json({ error: 'Space not found' }, { status: 404 });
  }

  const repoPath = space.gitRepo.repoPath;
  const envPath = path.join(repoPath, '.env');
  const secrets: { key: string; value: string }[] = [];

  if (fs.existsSync(envPath)) {
    try {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const eqIdx = trimmed.indexOf('=');
          const key = trimmed.substring(0, eqIdx).trim();
          const value = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
          if (key) {
            secrets.push({ key, value });
          }
        }
      });
    } catch (err: any) {
      return NextResponse.json({ error: `Failed to read secrets: ${err.message}` }, { status: 500 });
    }
  } else {
    // If no .env exists, pre-fill with OG_COMPUTE_API_KEY placeholder
    secrets.push({ key: 'OG_COMPUTE_API_KEY', value: '' });
  }

  return NextResponse.json({ secrets });
}

export async function POST(request: Request) {
  try {
    const { spaceId, secrets } = await request.json();

    if (!spaceId || !Array.isArray(secrets)) {
      return NextResponse.json({ error: 'spaceId and secrets array are required' }, { status: 400 });
    }

    const space = getSpaceById(spaceId);
    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const repoPath = space.gitRepo.repoPath;
    const envPath = path.join(repoPath, '.env');

    // Build the .env file content
    let envContent = '# Space environment variables\n';
    secrets.forEach((s: { key: string; value: string }) => {
      const key = s.key.trim().toUpperCase();
      const value = s.value.trim();
      if (key) {
        envContent += `${key}=${value}\n`;
      }
    });

    fs.writeFileSync(envPath, envContent, 'utf8');

    return NextResponse.json({ success: true, message: 'Secrets saved successfully' });
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to save secrets: ${err.message}` }, { status: 500 });
  }
}
