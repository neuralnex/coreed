import { NextResponse } from 'next/server';
import { getSpaceById } from '@/lib/spacesStore';
import { getSpacePort } from '@/lib/spaceRunner';
import http from 'http';
import https from 'https';

export async function GET(request: Request, context: { params: Promise<{ spaceId: string, path: string[] }> }) {
  return handleProxyRequest(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ spaceId: string, path: string[] }> }) {
  return handleProxyRequest(request, context);
}

export async function PUT(request: Request, context: { params: Promise<{ spaceId: string, path: string[] }> }) {
  return handleProxyRequest(request, context);
}

export async function DELETE(request: Request, context: { params: Promise<{ spaceId: string, path: string[] }> }) {
  return handleProxyRequest(request, context);
}

export async function PATCH(request: Request, context: { params: Promise<{ spaceId: string, path: string[] }> }) {
  return handleProxyRequest(request, context);
}

async function handleProxyRequest(request: Request, context: { params: Promise<{ spaceId: string, path: string[] }> }): Promise<NextResponse> {
  try {
    const { spaceId, path: pathParts } = await context.params;
    
    const proxyPath = '/' + pathParts.join('/');

    const storedSpace = getSpaceById(spaceId);
    if (!storedSpace) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 });
    }

    const port = getSpacePort(spaceId);
    if (!port) {
      return NextResponse.json({ 
        error: 'Space is not running',
        message: 'Start the space first',
        sdk: storedSpace.sdk
      }, { status: 503 });
    }

    const targetUrl = new URL(`http://localhost:${port}${proxyPath}`);
    targetUrl.search = new URL(request.url).search;

    const method = request.method;
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      if (!['host', 'content-length'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });

    let body: Buffer | null = null;
    if (method !== 'GET' && method !== 'HEAD') {
      body = Buffer.from(await request.arrayBuffer());
    }

    return new Promise((resolve) => {
      const protocol = targetUrl.protocol === 'https:' ? https : http;

      const req = protocol.request({
        hostname: targetUrl.hostname,
        port: targetUrl.port,
        path: targetUrl.pathname + targetUrl.search,
        method: method,
        headers: headers
      }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const responseBody = Buffer.concat(chunks);
          const responseHeaders: Record<string, string> = {};
          Object.entries(res.headers).forEach(([key, value]) => {
            if (value && typeof value === 'string') {
              responseHeaders[key.toLowerCase()] = value;
            } else if (Array.isArray(value)) {
              responseHeaders[key.toLowerCase()] = value.join(', ');
            }
          });

          resolve(new NextResponse(responseBody, {
            status: res.statusCode,
            headers: responseHeaders
          }));
        });
      });

      req.on('error', (err) => {
        console.error('Proxy error:', err);
        resolve(NextResponse.json({ 
          error: 'Failed to proxy request',
          details: err.message 
        }, { status: 502 }));
      });

      if (body) {
        req.write(body);
      }
      req.end();
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
