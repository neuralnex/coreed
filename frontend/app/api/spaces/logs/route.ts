import { NextResponse } from 'next/server';
import { getSpaceLogs } from '@/lib/spaceRunner';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get('spaceId');

    if (!spaceId) {
      return NextResponse.json({ error: 'spaceId is required' }, { status: 400 });
    }

    const logs = getSpaceLogs(spaceId);

    return NextResponse.json({
      spaceId,
      logs
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
