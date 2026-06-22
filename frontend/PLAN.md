# Coreed Platform Integration Plan

## 🎯 Current Status

The Space creation form has been updated to work with 0G's architecture:
- **Removed** Git Repository URL field (platform auto-creates repos)
- **Removed** Hardware selection (0G abstracts this away)
- **Auto-generates** endpoint URLs based on owner address + space name
- **Builds successfully** with all TypeScript checks passing

## 🏗️ Next Integration Steps

### Phase 1: Backend API Routes (High Priority)

#### 1. Create Space API Route (`app/api/spaces/create/route.ts`)
```typescript
// Handles Git repo creation, README.md generation, and template scaffolding
import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function POST(request: Request) {
  const { owner, spaceName, sdk, template } = await request.json();
  const slug = spaceName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  
  // 1. Create repo directory
  const repoDir = path.join(process.cwd(), 'storage', 'repos', owner, slug);
  fs.mkdirSync(repoDir, { recursive: true });
  
  // 2. Initialize Git repo
  execSync('git init', { cwd: repoDir });
  execSync('git checkout -b main', { cwd: repoDir });
  
  // 3. Generate README.md with front-matter
  const readmeContent = `---
title: ${spaceName}
owner: ${owner}
sdk: ${sdk}
template: ${template}
app_port: ${sdk === 'gradio' ? 7860 : sdk === 'fastapi' ? 8000 : 3000}
status: building
---
# ${spaceName}
Auto-generated Space on Coreed platform.
`;
  fs.writeFileSync(path.join(repoDir, 'README.md'), readmeContent);
  
  // 4. Scaffold template files based on SDK
  if (sdk === 'gradio') {
    // Write Gradio app file
    const appContent = `import gradio as gr

def greet(name):
    return f"Hello {name}!"

ui = gr.Interface(fn=greet, inputs="text", outputs="text")
ui.launch()
`;
    fs.writeFileSync(path.join(repoDir, 'app.py'), appContent);
  }
  
  // 5. Initial commit
  execSync('git add . && git commit -m "Initial scaffold"', { cwd: repoDir });
  
  // 6. Register on-chain (call AgentSpaceRegistry)
  // TODO: Integrate with frontend deploySpace
  
  return NextResponse.json({ 
    success: true, 
    repoPath: repoDir,
    endpointUrl: `https://${owner.slice(2)}.${slug}.coreed.ai` 
  });
}
```

#### 2. Git Push Webhook (`app/api/webhooks/git-push/route.ts`)
```typescript
// Handles post-receive hooks for auto-deployment
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export async function POST(request: Request) {
  const { repoPath } = await request.json();
  
  // 1. Read README.md for metadata
  const readmePath = path.join(repoPath, 'README.md');
  const fileContents = fs.readFileSync(readmePath, 'utf8');
  const { data: metadata } = matter(fileContents);
  
  // 2. Extract Docker/FastAPI/Gradio config
  const appPort = metadata.app_port || 7860;
  const containerName = path.basename(repoPath);
  
  // 3. Docker build & run (async)
  exec(`docker stop ${containerName} && docker rm ${containerName}`, () => {
    exec(`docker build -t ${containerName}-img ${repoPath}`, (buildError) => {
      if (!buildError) {
        exec(`docker run -d --name ${containerName} -p ${appPort}:${appPort} ${containerName}-img`);
      }
    });
  });
  
  return NextResponse.json({ status: "processing" });
}
```

### Phase 2: Template System

Create template directory structure:
```
frontend/
├── templates/
│   ├── gradio/
│   │   ├── app.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   ├── fastapi/
│   │   ├── main.py
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   └── static/
│       └── index.html
└── app/api/spaces/create/route.ts  # Copies from templates
```

### Phase 3: Storage Integration with 0G

For persistence on 0G Storage:
```typescript
// In the create route, after scaffold:
import { ZgFile, Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";

// Upload repo to 0G Storage
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const signer = new ethers.Wallet(process.env.PRIVATE_KEY!, provider);
const indexer = new Indexer(process.env.STORAGE_INDEXER!);

// Create a tar of the repo and upload
const tarFile = await createTarball(repoDir);
const file = await ZgFile.fromFilePath(tarFile);
const [tx, err] = await indexer.upload(file, process.env.RPC_URL!, signer);

// Store the root hash in the Space metadata
fs.writeFileSync(path.join(repoDir, '.coreed'), JSON.stringify({
  storageRootHash: tx?.hash,
  chain: '0g-galileo',
  createdAt: Date.now()
}));
```

### Phase 4: Docker Build Engine

Install Docker SDK for Node.js:
```bash
npm install dockerode
```

Update webhook to use Docker SDK instead of child_process:
```typescript
import Docker from 'dockerode';
const docker = new Docker();

// Build image
await docker.buildImage({
  context: repoPath,
  src: ['.']
}, { t: containerName });

// Create container
await docker.createContainer({
  Image: `${containerName}-img`,
  name: containerName,
  ExposedPorts: { [`${appPort}/tcp`]: {} },
  PortBindings: { [`${appPort}/tcp`]: [{ HostPort: String(appPort) }] }
}).then(container => container.start());
```

### Phase 5: Real-time Logs with SSE

Create log streaming endpoint:
```typescript
// app/api/spaces/[id]/logs/route.ts
import { NextRequest } from 'next/server';
import Docker from 'dockerode';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const docker = new Docker();
  const container = docker.getContainer(params.id);
  
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();
  
  container.logs({
    follow: true,
    stdout: true,
    stderr: true
  }, (err, stream) => {
    if (err) {
      writer.write(new TextEncoder().encode(`error: ${err.message}\n\n`));
      return;
    }
    
    docker.modem.followProgress(stream, (err, output) => {
      if (output) {
        writer.write(new TextEncoder().encode(`data: ${output.status}\n\n`));
      }
    });
  });
  
  return new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}
```

### Phase 6: Frontend Live Terminal Component

```tsx
// components/SpaceTerminal.tsx
'use client';
import { useEffect, useState, useRef } from 'react';

export function SpaceTerminal({ spaceId }: { spaceId: string }) {
  const [logs, setLogs] = useState<string[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const source = new EventSource(`/api/spaces/${spaceId}/logs`);
    source.onmessage = (e) => {
      setLogs(prev => [...prev, e.data]);
    };
    return () => source.close();
  }, [spaceId]);
  
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  
  return (
    <div className="bg-black text-green-400 font-mono p-4 rounded-lg h-64 overflow-y-auto">
      {logs.map((log, i) => (
        <div key={i}>{log}</div>
      ))}
      <div ref={endRef} />
    </div>
  );
}
```

### Phase 7: Health Check Endpoint

```typescript
// app/api/spaces/[id]/health/route.ts
import { NextResponse } from 'next/server';
import Docker from 'dockerode';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const docker = new Docker();
  
  try {
    const container = docker.getContainer(params.id);
    const inspect = await container.inspect();
    
    return NextResponse.json({
      isActive: inspect.State.Running,
      status: inspect.State.Status,
      health: inspect.State.Health?.Status
    });
  } catch (err) {
    return NextResponse.json({ isActive: false, error: err.message }, { status: 500 });
  }
}
```

## 📋 Implementation Checklist

- [x] Remove Git Repository URL field from form
- [x] Remove Hardware selection from form
- [x] Auto-generate endpoint URL from owner + space name
- [x] Build passes TypeScript validation
- [ ] Create `storage/repos/` directory structure
- [ ] Implement `POST /api/spaces/create` route
- [ ] Implement `POST /api/webhooks/git-push` route
- [ ] Create template files (gradio, fastapi, express, static)
- [ ] Add Docker SDK dependency
- [ ] Implement real-time log streaming
- [ ] Add health check endpoint
- [ ] Create SpaceTerminal component
- [ ] Integrate 0G Storage for repo persistence
- [ ] Add post-receive git hook configuration
- [ ] Test end-to-end flow with sample space

## 🔧 Required Dependencies

```bash
# Docker SDK
npm install dockerode

# Gray-matter for YAML front-matter parsing
npm install gray-matter

# 0G Storage SDK (already installed)
npm install @0gfoundation/0g-storage-ts-sdk ethers
```

## 🚀 Quick Start After Implementation

1. Ensure Docker is running on the server
2. Create `storage/repos/` directory with write permissions
3. Set up `.env` variables:
   ```
   DOCKER_ENABLED=true
   REPO_STORAGE_PATH=./storage/repos
   ```
4. Test with:
   ```bash
   curl -X POST http://localhost:3000/api/spaces/create \
     -H "Content-Type: application/json" \
     -d '{"owner":"0x123...abc","spaceName":"my-first-space","sdk":"gradio","template":"blank"}'
   ```

## 📝 Notes

- The platform creates Git repos at `storage/repos/{owner}/{space-name}/`
- Each repo gets an auto-generated README.md with YAML front-matter
- Templates are copied from `templates/{sdk}/`
- Post-receive hooks trigger Docker builds via webhook
- Containers are named after the space slug
- All spaces are accessible at `https://{owner-short}.{space-name}.coreed.ai`
- 0G Storage is used for persistence (optional but recommended)
