import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repoPath = searchParams.get('repoPath');

  if (!repoPath) {
    return NextResponse.json({ error: 'repoPath parameter is required' }, { status: 400 });
  }

  try {
    if (!fs.existsSync(repoPath)) {
      return NextResponse.json({ error: 'Repository path not found' }, { status: 404 });
    }

    const items = fs.readdirSync(repoPath);

    const files = items.map(item => {
      const itemPath = path.join(repoPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        return {
          name: item,
          path: itemPath,
          type: 'directory' as const,
          children: []
        };
      } else {
        return {
          name: item,
          path: itemPath,
          type: 'file' as const,
          extension: path.extname(item).replace('.', ''),
          size: stats.size
        };
      }
    });

    files.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'directory' ? 1 : -1;
    });

    return NextResponse.json({ files, repoPath, count: files.length });
  } catch (error: any) {
    console.error('Failed to read repository files:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to read repository files'
    }, { status: 500 });
  }
}
