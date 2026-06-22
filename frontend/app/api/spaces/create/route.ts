/**
 * Space Creation API - Simplified for 0G
 * 
 * Fast workflow:
 * 1. Creates Git repository (simple, not bare)
 * 2. Generates README.md with 0G integration
 * 3. Scaffolds template files with 0G Compute calls
 * 4. Tests 0G Compute connection
 * 5. Returns immediately with Git repo info
 * 
 * Optimized for 0G: No on-chain registration, no Docker builds
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { addSpace, getSpaceById, getSpacesByOwner, getAllSpaces } from '@/lib/spacesStore';

// Environment configuration
const OG_COMPUTE_API_KEY = process.env.OG_COMPUTE_API_KEY;
const OG_COMPUTE_BASE_URL = process.env.NEXT_PUBLIC_COMPUTE_ROUTER || 'https://router-api.0g.ai/v1';
const REPO_STORAGE_PATH = process.env.REPO_STORAGE_PATH || './storage/repos';
const APP_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN || 'localhost';

/**
 * Scaffold template files with 0G Compute integration
 */
function scaffoldTemplate(repoPath: string, sdk: string, template: string, spaceName: string, appPort: number) {
  const templates: Record<string, Record<string, Record<string, string>>> = {
    gradio: {
      blank: {
        'app.py': `import gradio as gr
import requests
import os

def chat(message, history):
    try:
        api_key = os.getenv('OG_COMPUTE_API_KEY', '${OG_COMPUTE_API_KEY}')
        response = requests.post(
            "${OG_COMPUTE_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": "zai-org/GLM-4-Flash", "messages": [{"role": "user", "content": message}], "max_tokens": 50}
        )
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error: {str(e)}"

ui = gr.ChatInterface(fn=chat, title="${spaceName}", description="Powered by 0G Compute")
ui.launch(server_name="0.0.0.0", server_port=${appPort})
`,
        'requirements.txt': 'gradio==4.31.0\nrequests\n'
      },
      chatbot: {
        'app.py': `import gradio as gr
import requests
import os

def chat(message, history):
    try:
        api_key = os.getenv('OG_COMPUTE_API_KEY', '${OG_COMPUTE_API_KEY}')
        response = requests.post(
            "${OG_COMPUTE_BASE_URL}/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={"model": "zai-org/GLM-4-Flash", "messages": [{"role": "user", "content": message}], "max_tokens": 100}
        )
        return response.json()["choices"][0]["message"]["content"]
    except Exception as e:
        return f"Error: {str(e)}"

ui = gr.ChatInterface(fn=chat, title="${spaceName}", description="Chat with AI on 0G")
ui.launch(server_name="0.0.0.0", server_port=${appPort})
`,
        'requirements.txt': 'gradio==4.31.0\nrequests\n'
      }
    },
    fastapi: {
      blank: {
        'main.py': `from fastapi import FastAPI
import requests
import os
import uvicorn

app = FastAPI(title="${spaceName}")
OG_API_KEY = os.getenv('OG_COMPUTE_API_KEY', '${OG_COMPUTE_API_KEY}')
OG_URL = "${OG_COMPUTE_BASE_URL}"

@app.get("/")
def read_root():
    return {"message": "${spaceName} - Powered by 0G Compute"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat")
def chat(message: str):
    try:
        response = requests.post(f"{OG_URL}/chat/completions", headers={"Authorization": f"Bearer {OG_API_KEY}", "Content-Type": "application/json"}, json={"model": "zai-org/GLM-4-Flash", "messages": [{"role": "user", "content": message}], "max_tokens": 50})
        return response.json()
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=${appPort})
`,
        'requirements.txt': 'fastapi==0.109.0\nuvicorn==0.27.0\nrequests\n'
      }
    },
    express: {
      blank: {
        'index.js': `const express = require('express');
const axios = require('axios');
const app = express();
const port = ${appPort};

app.use(express.json());

app.get('/', (req, res) => {
  res.send('${spaceName} - Powered by 0G Compute');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/chat', async (req, res) => {
  try {
    const message = req.body.message;
    const apiKey = process.env.OG_COMPUTE_API_KEY || '${OG_COMPUTE_API_KEY}';
    const response = await axios.post('${OG_COMPUTE_BASE_URL}/chat/completions', {
      model: 'zai-org/GLM-4-Flash',
      messages: [{ role: 'user', content: message }],
      max_tokens: 50
    }, { headers: { 'Authorization': \`Bearer \${apiKey}\`, 'Content-Type': 'application/json' } });
    res.json(response.data);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(\`${spaceName} running at http://localhost:\${port}\`);
});
`,
        'package.json': `{
  "name": "${spaceName}",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "start": "node index.js" },
  "dependencies": { "express": "^4.18.2", "axios": "^1.6.2" }
}`
      }
    },
    static: {
      blank: {
        'index.html': `<!DOCTYPE html>
<html><head><title>${spaceName}</title>
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<style>body{font-family:Arial,sans-serif;text-align:center;padding:40px}h1{color:#333}</style>
</head><body>
<h1>${spaceName}</h1><p>Powered by 0G Compute</p>
<div><input type="text" id="message" placeholder="Type a message..." />
<button onclick="sendMessage()">Send</button><div id="response"></div></div>
<script>
async function sendMessage(){
  const msg=document.getElementById('message').value;
  document.getElementById('response').innerHTML='Thinking...';
  try{
    const r=await axios.post('${OG_COMPUTE_BASE_URL}/chat/completions',{
      model:'zai-org/GLM-4-Flash',messages:[{role:'user',content:msg}],max_tokens:50
    },{headers:{'Authorization':'Bearer ${OG_COMPUTE_API_KEY}','Content-Type':'application/json'}});
    document.getElementById('response').innerHTML=r.data.choices[0].message.content;
  }catch(e){document.getElementById('response').innerHTML='Error: '+e.message}
}
</script>
</body></html>`
      }
    },
    docker: {
      blank: {
        'Dockerfile': `FROM python:3.10-slim\nWORKDIR /app\nCOPY requirements.txt .\nRUN pip install -r requirements.txt\nCOPY . .\nEXPOSE ${appPort}\nCMD ["python", "app.py"]`,
        'requirements.txt': '# Add your dependencies\n',
        'app.py': '# Your app here\nimport os\nAPI_KEY=os.getenv("OG_COMPUTE_API_KEY","${OG_COMPUTE_API_KEY}")\nENDPOINT="${OG_COMPUTE_BASE_URL}/chat/completions"'
      }
    }
  };

  const sdkTemplates = templates[sdk as keyof typeof templates];
  const selectedTemplate = template && sdkTemplates?.[template as keyof typeof sdkTemplates]
    ? sdkTemplates[template as keyof typeof sdkTemplates]
    : sdkTemplates?.blank || {};

  Object.entries(selectedTemplate).forEach(([filename, content]) => {
    if (typeof content === 'string') {
      const filePath = path.join(repoPath, filename);
      fs.writeFileSync(filePath, content.replace(/\$\{spaceName\}/g, spaceName));
    }
  });
}

/**
 * POST /api/spaces/create
 */
export async function POST(request: Request) {
  try {
    const { name, description = '', sdk = 'gradio', template = 'blank', owner, slug } = await request.json();

    if (!name || !owner) {
      return NextResponse.json({ error: 'Space name and owner address are required' }, { status: 400 });
    }

    const spaceSlug = slug || name.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const appPort = sdk === 'gradio' ? 7860 : sdk === 'fastapi' ? 8000 : sdk === 'express' ? 3000 : 8080;
    const reposRoot = path.join(process.cwd(), REPO_STORAGE_PATH);
    const repoPath = path.join(reposRoot, owner, spaceSlug);

    // Create directories
    fs.mkdirSync(repoPath, { recursive: true });

    // Initialize Git repo
    execSync('git init', { cwd: repoPath, stdio: 'pipe' });
    execSync('git checkout -b main', { cwd: repoPath, stdio: 'pipe' });
    execSync('git config user.email "coreed@0g.ai"', { cwd: repoPath, stdio: 'pipe' });
    execSync('git config user.name "Coreed Platform"', { cwd: repoPath, stdio: 'pipe' });

    // Generate README.md
    const readmeContent = `--- 
title: ${name}
owner: ${owner}
sdk: ${sdk}
template: ${template}
app_port: ${appPort}
runtime: ${sdk === 'gradio' || sdk === 'fastapi' ? 'python' : sdk === 'express' ? 'node' : 'docker'}
status: created
---

# ${name}
${description || 'A Coreed Agent Space on 0G'}

## Quick Start

1. Clone: \`git clone file:///${repoPath}\`
2. cd ${spaceSlug}
3. ${sdk === 'gradio' || sdk === 'fastapi' ? 'pip install -r requirements.txt' : sdk === 'express' ? 'npm install' : 'npm install'}
4. ${sdk === 'gradio' ? 'python app.py' : sdk === 'fastapi' ? 'uvicorn main:app --host 0.0.0.0 --port ' + appPort : sdk === 'express' ? 'node index.js' : 'docker build -t my-space . && docker run -p ' + appPort + ':' + appPort + ' my-space'}
5. Open http://localhost:${appPort}

## 0G Integration
Your app uses 0G Compute Router for AI inference:
- Endpoint: \${OG_COMPUTE_BASE_URL}
- Your API key: Set via OG_COMPUTE_API_KEY environment variable
`;

    fs.writeFileSync(path.join(repoPath, 'README.md'), readmeContent);

    // Scaffold template files
    scaffoldTemplate(repoPath, sdk, template, name, appPort);

    // Initial commit
    execSync('git add .', { cwd: repoPath, stdio: 'pipe' });
    execSync('git commit -m "Initial space scaffold - 0G Powered"', { cwd: repoPath, stdio: 'pipe' });

    // Store the space in memory so it can be listed
    const coreedEndpointUrl = `https://${owner.slice(2)}.${spaceSlug}.${APP_DOMAIN === 'localhost' ? 'coreed.app' : APP_DOMAIN}`;
    const localEndpointUrl = `http://localhost:${appPort}`;
    
    // Store space info
    addSpace({
      spaceId: spaceSlug,
      name,
      slug: spaceSlug,
      description,
      sdk,
      template,
      owner,
      endpointUrl: coreedEndpointUrl,
      gitRepo: {
        cloneUrl: `file://${repoPath}`,
        repoPath: repoPath
      },
      createdAt: Date.now(),
      status: 'created'
    });

    // Test 0G Compute connection
    interface ComputeInfo {
      connected: boolean;
      baseUrl: string;
      requiresApiKey: boolean;
      models: any[];
      error: string | null;
    }
    
    let computeInfo: ComputeInfo = { connected: false, baseUrl: OG_COMPUTE_BASE_URL, requiresApiKey: !OG_COMPUTE_API_KEY, models: [], error: null };
    let deployment: { id?: string; model?: string; endpoint?: string; status?: string } = {};

    if (OG_COMPUTE_API_KEY) {
      try {
        const modelsResponse = await fetch(`${OG_COMPUTE_BASE_URL}/models`, {
          headers: { 'Authorization': `Bearer ${OG_COMPUTE_API_KEY}` }
        });
        if (modelsResponse.ok) {
          const modelsData = await modelsResponse.json();
          computeInfo = { ...computeInfo, connected: true, models: modelsData.data?.slice(0, 10) || [] };
          deployment = { 
            id: `coreed-${spaceSlug}-${Date.now()}`, 
            model: modelsData.data?.[0]?.id || 'zai-org/GLM-4-Flash',
            endpoint: `${OG_COMPUTE_BASE_URL}/chat/completions`,
            status: 'ready'
          };
        }
      } catch (err: any) {
        computeInfo = { ...computeInfo, error: err.message };
      }
    } else {
      computeInfo = { ...computeInfo, error: '0G Compute API key not configured' };
    }

    return NextResponse.json({
      success: true,
      space: {
        name,
        slug: spaceSlug,
        description,
        sdk,
        template,
        owner,
        spaceId: spaceSlug,
        endpointUrl: coreedEndpointUrl,
        localEndpointUrl: localEndpointUrl,
        gitRepo: {
          cloneUrl: `file://${repoPath}`,
          repoPath: repoPath
        }
      },
      compute: computeInfo,
      deployment,
      nextSteps: computeInfo.connected ? [
        `git clone file:///${repoPath}`,
        `cd ${spaceSlug}`,
        `${sdk === 'gradio' || sdk === 'fastapi' ? 'pip install -r requirements.txt' : 'npm install'}`,
        `${sdk === 'gradio' ? 'python app.py' : sdk === 'fastapi' ? 'uvicorn main:app --host 0.0.0.0 --port ' + appPort : 'node index.js'}`,
        `Access at: ${coreedEndpointUrl}`
      ] : [
        `Space created! Git repo: file:///${repoPath}`,
        `To enable AI: Add OG_COMPUTE_API_KEY to .env`,
        `Then run: cd ${spaceSlug} && ${sdk === 'gradio' ? 'pip install -r requirements.txt && python app.py' : 'npm install && node index.js'}`
      ]
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message, details: error.stack }, { status: 500 });
  }
}

/**
 * GET /api/spaces/create
 * Returns configuration and can list spaces
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  
  if (owner) {
    // Return spaces for a specific owner
    const ownerSpaces = getSpacesByOwner(owner);
    return NextResponse.json({
      spaces: ownerSpaces,
      count: ownerSpaces.length
    });
  }
  
  // Return all spaces
  const allSpaces = getAllSpaces();
  return NextResponse.json({
    configuration: {
      rpcUrl: process.env.NEXT_PUBLIC_RPC_URL || 'https://evmrpc-testnet.0g.ai',
      compute: { baseUrl: OG_COMPUTE_BASE_URL, hasApiKey: !!OG_COMPUTE_API_KEY },
      storage: { reposPath: REPO_STORAGE_PATH }
    },
    spaces: allSpaces,
    count: allSpaces.length,
    message: 'Coreed Space creation API ready for 0G'
  });
}
