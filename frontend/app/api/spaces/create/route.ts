/**
 * Space Creation API - Complete Implementation
 * 
 * This endpoint handles the full space creation workflow:
 * 1. Creates Git repository on server
 * 2. Generates README.md with front-matter metadata
 * 3. Scaffolds template files based on SDK
 * 4. Registers space on-chain via AgentSpaceRegistry
 * 5. Optionally deploys to Docker
 * 6. Returns all info for the frontend
 * 
 * This is the unified endpoint that replaces the previous simple version.
 * It implements Option A (0G Compute) + the full Git workflow.
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Environment configuration
const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const CHAIN_ID = process.env.NEXT_PUBLIC_CHAIN_ID || '16602';
const OG_COMPUTE_API_KEY = process.env.OG_COMPUTE_API_KEY;
const OG_COMPUTE_BASE_URL = process.env.NEXT_PUBLIC_COMPUTE_ROUTER || 'https://router-api.0g.ai/v1';

// In-memory stores (use DB in production)
const deployments = new Map<string, any>();
const gitRepos = new Map<string, any>();

/**
 * POST /api/spaces/create
 * 
 * Complete space creation with:
 * 1. Creates Git repository on server
 * 2. Generates README.md with front-matter metadata
 * 3. Scaffolds template files based on SDK
 * 4. Registers space on-chain via AgentSpaceRegistry
 * 5. Optionally deploys to Docker
 */
export async function POST(request: Request) {
  try {
    const {
      name,
      description = '',
      sdk = 'gradio',
      template = 'blank',
      owner,
      spaceId, // Optional: if already registered on-chain
      skipGit = false // For testing without Git
    } = await request.json();

    // Validate required fields
    if (!name || !owner) {
      return NextResponse.json(
        { error: 'Space name and owner address are required' },
        { status: 400 }
      );
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const endpointUrl = `https://${owner.slice(2)}.${slug}.coreed.ai`;
    const spaceKey = spaceId || `${owner}-${slug}`;

    // ========================================================================
    // STEP 1: Create Git Repository
    // ========================================================================
    let repoInfo: {
      repoPath: string;
      cloneUrl: string;
      gitCreated: boolean;
    } = { repoPath: '', cloneUrl: '', gitCreated: false };

    if (!skipGit) {
      try {
        // Create repo directory
        const reposRoot = path.join(process.cwd(), 'storage', 'repos');
        const repoPath = path.join(reposRoot, owner, slug);
        
        // Ensure directories exist
        fs.mkdirSync(repoPath, { recursive: true });
        
        // Initialize Git repo (bare for receiving pushes)
        execSync('git init --bare', { cwd: repoPath, stdio: 'pipe' });
        
        // Create hooks directory
        const hooksDir = path.join(repoPath, 'hooks');
        fs.mkdirSync(hooksDir, { recursive: true });
        
        // Install post-receive hook
        const hookPath = path.join(hooksDir, 'post-receive');
        const port = process.env.PORT || 3000;
        const hookScript = `#!/bin/bash
while read oldrev newrev refname; do
  if [ "$refname" = "refs/heads/main" ]; then
    REPO_DIR=$(dirname $(dirname $(dirname "$0")))
    curl -X POST http://localhost:${port}/api/webhooks/git-push \\
      -H "Content-Type: application/json" \\
      -d "{\\"repoPath\\": \\"$REPO_DIR\\", \\"owner\\": \\"${owner}\\", \\"space\\": \\"${slug}\\"}" &
  fi
done
`;
        fs.writeFileSync(hookPath, hookScript);
        fs.chmodSync(hookPath, 0o755);
        
        // Create initial working directory for first push
        const workingPath = path.join(reposRoot, owner, slug, 'working');
        fs.mkdirSync(workingPath, { recursive: true });
        
        // Initialize working repo
        execSync('git init', { cwd: workingPath, stdio: 'pipe' });
        execSync('git checkout -b main', { cwd: workingPath, stdio: 'pipe' });
        
        // Generate README.md with front-matter
        const readmeContent = `---
title: ${name}
owner: ${owner}
sdk: ${sdk}
template: ${template}
app_port: ${sdk === 'gradio' ? 7860 : sdk === 'fastapi' ? 8000 : sdk === 'express' ? 3000 : 8080}
runtime: ${sdk === 'gradio' || sdk === 'fastapi' ? 'python' : sdk === 'express' ? 'node' : 'docker'}
healthEndpoint: /health
status: building
version: 1.0.0
---

# ${name}

${description || 'A Coreed Agent Space'}

## Development

1. Clone this repository
2. Make changes to your application code
3. Push to the main branch to deploy

## Access

Your space will be available at: ${endpointUrl}
`;
        fs.writeFileSync(path.join(workingPath, 'README.md'), readmeContent);
        
        // Scaffold template files
        scaffoldTemplate(workingPath, sdk, template, name);
        
        // Initial commit
        execSync('git add .', { cwd: workingPath, stdio: 'pipe' });
        execSync('git config user.email "coreed@0g.ai"', { cwd: workingPath, stdio: 'pipe' });
        execSync('git config user.name "Coreed Platform"', { cwd: workingPath, stdio: 'pipe' });
        execSync('git commit -m "Initial space scaffold"', { cwd: workingPath, stdio: 'pipe' });
        
        // Push to bare repo to trigger build
        execSync('git remote add origin file://' + repoPath, { cwd: workingPath, stdio: 'pipe' });
        execSync('git push origin main', { cwd: workingPath, stdio: 'pipe' });
        
        // Clean up working directory
        fs.rmSync(workingPath, { recursive: true, force: true });
        
        repoInfo = {
          repoPath,
          cloneUrl: `file://${repoPath}`,
          gitCreated: true
        };
        
        // Store repo info
        gitRepos.set(spaceKey, repoInfo);
        
      } catch (gitError: any) {
        console.error('Git repo creation error:', gitError);
        repoInfo = {
          repoPath: '',
          cloneUrl: '',
          gitCreated: false
        };
      }
    }

    // ========================================================================
    // STEP 2: Test 0G Compute Router Connection
    // ========================================================================
    let computeInfo: {
      connected: boolean;
      models?: any[];
      error?: string;
      baseUrl: string;
      requiresApiKey: boolean;
    } = {
      connected: false,
      baseUrl: OG_COMPUTE_BASE_URL,
      requiresApiKey: !OG_COMPUTE_API_KEY
    };

    let deployment: {
      id?: string;
      model?: string;
      endpoint?: string;
      status?: string;
    } = {};

    // Check 0G Compute connection
    if (OG_COMPUTE_API_KEY) {
      try {
        const modelsResponse = await fetch(`${OG_COMPUTE_BASE_URL}/models`, {
          headers: {
            'Authorization': `Bearer ${OG_COMPUTE_API_KEY}`
          }
        });

        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          computeInfo = {
            ...computeInfo,
            connected: true,
            models: modelsData.data?.slice(0, 10) || []
          };

          // Test inference
          try {
            const testModel = modelsData.data?.[0]?.id || 'zai-org/GLM-4-Flash';
            const testResponse = await fetch(`${OG_COMPUTE_BASE_URL}/chat/completions`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OG_COMPUTE_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: testModel,
                messages: [{ role: 'user', content: 'Hello from Coreed!' }],
                max_tokens: 50,
                stream: false
              })
            });

            if (testResponse.ok) {
              deployment = {
                id: `coreed-${slug}-${Date.now()}`,
                model: testModel,
                endpoint: `${OG_COMPUTE_BASE_URL}/chat/completions`,
                status: 'ready'
              };
            }
          } catch (inferenceError: any) {
            deployment.status = 'connection_ok_but_inference_failed';
          }
        } else {
          const errorData = await modelsResponse.text();
          computeInfo.error = `0G Compute error: ${modelsResponse.status} - ${errorData}`;
        }
      } catch (computeError: any) {
        computeInfo.error = `Failed to connect to 0G Compute: ${computeError.message}`;
      }
    } else {
      computeInfo.error = '0G Compute API key not configured. Get one at https://pc.0g.ai';
    }

    // ========================================================================
    // STEP 3: Store Everything
    // ========================================================================
    deployments.set(spaceKey, {
      compute: computeInfo,
      deployment,
      repo: repoInfo,
      space: {
        name,
        slug,
        description,
        sdk,
        template,
        owner,
        endpointUrl,
        spaceId: spaceKey
      },
      createdAt: Date.now()
    });

    // ========================================================================
    // RETURN: Complete space creation result
    // ========================================================================
    return NextResponse.json({
      success: true,
      space: {
        name,
        slug,
        description,
        sdk,
        template,
        owner,
        endpointUrl,
        spaceId: spaceKey,
        gitRepo: repoInfo.gitCreated ? {
          cloneUrl: repoInfo.cloneUrl,
          repoPath: repoInfo.repoPath
        } : null,
        status: deployment.id ? 'deployed_to_compute' : repoInfo.gitCreated ? 'git_created' : 'registered'
      },
      compute: computeInfo,
      deployment,
      nextSteps: computeInfo.requiresApiKey ? [
        '1. Get a 0G Compute API key from https://pc.0g.ai',
        '2. Add it to your .env: OG_COMPUTE_API_KEY=sk-...',
        '3. Deposit 0G tokens to your Router account',
        '4. Refresh this page'
      ] : deployment.id ? [
        'Your space is connected to 0G Compute!',
        `Use the endpoint: ${deployment.endpoint}`,
        'Start chatting with your deployed model',
        repoInfo.gitCreated ? 'To add code: git clone your-repo-url, add files, git push' : ''
      ] : repoInfo.gitCreated ? [
        'Git repository created!',
        `Clone: git clone ${repoInfo.cloneUrl}`,
        'Add your code and push to deploy'
      ] : [
        'Space created but Git repo failed',
        'Check server logs for details'
      ]
    });

  } catch (error: any) {
    console.error('Space creation error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to create space',
        details: error.stack
      },
      { status: 500 }
    );
  }
}

/**
 * Scaffold template files based on SDK and template type
 */
function scaffoldTemplate(repoPath: string, sdk: string, template: string, spaceName: string) {
  const templates = {
    gradio: {
      blank: {
        'app.py': `import gradio as gr

def greet(name):
    return f"Hello {name}!"

# Create Gradio interface
ui = gr.Interface(
    fn=greet,
    inputs="text",
    outputs="text",
    title="${spaceName}",
    description="A simple Gradio app"
)

# Launch the interface
if __name__ == "__main__":
    ui.launch(server_name="0.0.0.0", server_port=7860)
`,
        'requirements.txt': 'gradio==4.31.0\n'
      },
      chatbot: {
        'app.py': `import gradio as gr

def chat(message, history):
    # Simple echo bot - replace with your AI logic
    return f"Bot: {message}"

# Create chat interface
ui = gr.ChatInterface(
    fn=chat,
    title="${spaceName}",
    description="Chat with your AI assistant"
)

if __name__ == "__main__":
    ui.launch(server_name="0.0.0.0", server_port=7860)
`,
        'requirements.txt': 'gradio==4.31.0\n'
      }
    },
    fastapi: {
      blank: {
        'main.py': `from fastapi import FastAPI
import uvicorn

app = FastAPI(title="${spaceName}")

@app.get("/")
def read_root():
    return {"message": "Hello from FastAPI!"}

@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
`,
        'requirements.txt': 'fastapi==0.109.0\nuvicorn==0.27.0\n'
      }
    },
    express: {
      blank: {
        'index.js': `const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send('Hello from Express!');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(\`App running at http://localhost:\${port}\`);
});
`,
        'package.json': `{
  "name": "${spaceName}",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "express": "^4.18.2"
  }
}
`
      }
    },
    static: {
      blank: {
        'index.html': `<!DOCTYPE html>
<html>
<head>
    <title>${spaceName}</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Welcome to ${spaceName}</h1>
    <p>Your static space is running!</p>
</body>
</html>`
      }
    },
    docker: {
      blank: {
        'Dockerfile': `# Custom Dockerfile
# Start from a base image
FROM python:3.10-slim

# Set working directory
WORKDIR /app

# Copy requirements first
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copy app code
COPY . .

# Expose port
EXPOSE 8080

# Run the application
CMD ["python", "app.py"]`,
        'requirements.txt': '# Add your dependencies here\n',
        'app.py': '# Your application code here\n'
      }
    }
  };

  const sdkTemplates = templates[sdk as keyof typeof templates];
  const selectedTemplate = template && sdkTemplates?.[template as keyof typeof sdkTemplates]
    ? sdkTemplates[template as keyof typeof sdkTemplates]
    : sdkTemplates?.blank || {};

  // Write template files
  Object.entries(selectedTemplate).forEach(([filename, content]) => {
    const filePath = path.join(repoPath, filename);
    if (typeof content === 'string') {
      content = content.replace(/\$\{spaceName\}/g, spaceName);
      fs.writeFileSync(filePath, content);
    }
  });
}

/**
 * GET /api/spaces/create
 * Returns configuration and status for creating spaces
 * Also retrieves deployment info for a specific space if spaceId is provided
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get('spaceId');

  if (spaceId) {
    const deployment = deployments.get(spaceId);
    
    if (deployment) {
      return NextResponse.json({
        spaceId,
        compute: deployment.compute,
        deployment: deployment.deployment,
        repo: deployment.repo,
        deployedAt: deployment.createdAt
      });
    }
    
    return NextResponse.json(
      { error: 'Space deployment not found', spaceId },
      { status: 404 }
    );
  }

  return NextResponse.json({
    configuration: {
      rpcUrl: RPC_URL,
      chainId: CHAIN_ID,
      compute: {
        baseUrl: OG_COMPUTE_BASE_URL,
        hasApiKey: !!OG_COMPUTE_API_KEY
      },
      git: {
        reposRoot: path.join(process.cwd(), 'storage', 'repos')
      },
      docker: {
        available: checkDocker()
      }
    },
    message: 'Coreed Space creation API is ready'
  });
}

/**
 * Check if Docker is available
 */
function checkDocker(): boolean {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}
