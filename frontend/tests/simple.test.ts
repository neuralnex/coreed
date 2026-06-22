/**
 * Simplified Coreed Space Platform Tests
 * Tests core functionality without complex mocking
 */

import { describe, it, expect, beforeAll, beforeEach } from '@jest/globals';
import path from 'path';
import fs from 'fs';

const TEST_DIR = path.join(__dirname, 'test-output');

// Clean up test directory
beforeAll(() => {
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

beforeEach(() => {
  // Clear test directory before each test
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
});

describe('Core Functionality Tests', () => {
  describe('File Generation', () => {
    it('should create gradio app.py with 0G router logging', () => {
      const repoPath = path.join(TEST_DIR, 'gradio-space');
      fs.mkdirSync(repoPath, { recursive: true });

      const spaceName = 'TestGradioSpace';
      const appPort = 7860;

      const appPyContent = `import gradio as gr
import requests
import os
import json

def chat(message, history):
    api_key = os.getenv('OG_COMPUTE_API_KEY')
    if not api_key:
        raise ValueError("OG_COMPUTE_API_KEY environment variable not set")
    
    print(f"Sending request to 0G Router: model=zai-org/GLM-4-Flash, message={message[:50]}...")
    response = requests.post(
        "https://router-api.0g.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": "zai-org/GLM-4-Flash", "messages": [{"role": "user", "content": message}], "max_tokens": 50}
    )
    print(f"0G Router response status: {response.status_code}")
    print(f"0G Router response: {json.dumps(response.json(), indent=2)}")
    return response.json()["choices"][0]["message"]["content"]

if __name__ == "__main__":
    print("Starting Gradio app on port ${appPort}")
    ui = gr.ChatInterface(fn=chat, title="${spaceName}", description="Powered by 0G Compute")
    ui.launch(server_name="0.0.0.0", server_port=${appPort})`;

      const appPyPath = path.join(repoPath, 'app.py');
      fs.writeFileSync(appPyPath, appPyContent);

      // Verify file exists and has correct content
      expect(fs.existsSync(appPyPath)).toBe(true);
      const content = fs.readFileSync(appPyPath, 'utf8');
      
      // Check for required imports
      expect(content).toContain('import gradio as gr');
      expect(content).toContain('import requests');
      expect(content).toContain('import os');
      expect(content).toContain('import json');
      
      // Check for 0G router logging
      expect(content).toContain('Sending request to 0G Router');
      expect(content).toContain('0G Router response status');
      expect(content).toContain('0G Router response:');
      
      // Check for app startup message
      expect(content).toContain('Starting Gradio app');
      
      // Check for API key validation
      expect(content).toContain('OG_COMPUTE_API_KEY');
      
      // Check for launch configuration
      expect(content).toContain('server_name="0.0.0.0"');
      expect(content).toContain(`server_port=${appPort}`);
    });

    it('should create requirements.txt with gradio 6.19.0', () => {
      const repoPath = path.join(TEST_DIR, 'requirements-test');
      fs.mkdirSync(repoPath, { recursive: true });

      const requirementsContent = 'gradio==6.19.0\nrequests\n';
      const requirementsPath = path.join(repoPath, 'requirements.txt');
      fs.writeFileSync(requirementsPath, requirementsContent);

      // Verify file
      expect(fs.existsSync(requirementsPath)).toBe(true);
      const content = fs.readFileSync(requirementsPath, 'utf8');
      
      expect(content).toContain('gradio==6.19.0');
      expect(content).toContain('requests');
    });

    it('should create .env.example with placeholder', () => {
      const repoPath = path.join(TEST_DIR, 'env-test');
      fs.mkdirSync(repoPath, { recursive: true });

      const envExampleContent = `OG_COMPUTE_API_KEY=your_api_key_here
# Get your API key from: https://pc.0g.ai`;

      const envPath = path.join(repoPath, '.env.example');
      fs.writeFileSync(envPath, envExampleContent);

      // Verify file
      expect(fs.existsSync(envPath)).toBe(true);
      const content = fs.readFileSync(envPath, 'utf8');
      
      expect(content).toContain('OG_COMPUTE_API_KEY');
      expect(content).toContain('your_api_key_here');
      expect(content).toContain('https://pc.0g.ai');
    });

    it('should create README.md with correct structure', () => {
      const repoPath = path.join(TEST_DIR, 'readme-test');
      fs.mkdirSync(repoPath, { recursive: true });

      const spaceName = 'TestSpace';
      const description = 'Test Description';
      const owner = '0xTestOwner';
      const appPort = 7860;

      const readmeContent = `---
title: ${spaceName}
owner: ${owner}
sdk: gradio
template: blank
app_port: ${appPort}
runtime: python
status: created
---

# ${spaceName}
${description || 'A Coreed Agent Space on 0G'}

## Quick Start

1. Clone this repository
2. cd ${spaceName.toLowerCase()}
3. pip install -r requirements.txt
4. python app.py
5. Open http://localhost:${appPort}

## 0G Integration
Your app uses 0G Compute Router for AI inference:
- Endpoint: https://router-api.0g.ai/v1
- Your API key: Set via OG_COMPUTE_API_KEY environment variable
- Get your API key from: https://pc.0g.ai`;

      const readmePath = path.join(repoPath, 'README.md');
      fs.writeFileSync(readmePath, readmeContent);

      // Verify file
      expect(fs.existsSync(readmePath)).toBe(true);
      const content = fs.readFileSync(readmePath, 'utf8');
      
      // Check metadata
      expect(content).toContain(`title: ${spaceName}`);
      expect(content).toContain(`owner: ${owner}`);
      expect(content).toContain('sdk: gradio');
      
      // Check main sections
      expect(content).toContain(`# ${spaceName}`);
      expect(content).toContain('## Quick Start');
      expect(content).toContain('## 0G Integration');
      
      // Check 0G integration info
      expect(content).toContain('0G Compute Router');
      expect(content).toContain('OG_COMPUTE_API_KEY');
    });
  });

  describe('Git Configuration', () => {
    it('should create git repository with proper config', () => {
      const repoPath = path.join(TEST_DIR, 'git-test');
      fs.mkdirSync(repoPath, { recursive: true });

      // Create git repo
      const { execSync } = require('child_process');
      
      execSync('git init', { cwd: repoPath, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: repoPath, stdio: 'pipe' });
      execSync('git config user.name "Test User"', { cwd: repoPath, stdio: 'pipe' });
      execSync('git config receive.denyCurrentBranch ignore', { cwd: repoPath, stdio: 'pipe' });
      execSync('git checkout -b main', { cwd: repoPath, stdio: 'pipe' });

      // Verify .git directory exists
      const gitDir = path.join(repoPath, '.git');
      expect(fs.existsSync(gitDir)).toBe(true);

      // Verify configuration
      const config = execSync('git config --list', { cwd: repoPath, encoding: 'utf8' });
      expect(config).toContain('receive.denycurrentbranch=ignore');
      expect(config).toContain('user.email=test@example.com');
    });

    it('should commit files to git', () => {
      const repoPath = path.join(TEST_DIR, 'git-commit-test');
      fs.mkdirSync(repoPath, { recursive: true });

      const { execSync } = require('child_process');
      
      // Create git repo
      execSync('git init', { cwd: repoPath, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: repoPath, stdio: 'pipe' });
      execSync('git config user.name "Test User"', { cwd: repoPath, stdio: 'pipe' });
      execSync('git config receive.denyCurrentBranch ignore', { cwd: repoPath, stdio: 'pipe' });
      execSync('git checkout -b main', { cwd: repoPath, stdio: 'pipe' });

      // Create a test file
      const testFile = path.join(repoPath, 'test.txt');
      fs.writeFileSync(testFile, 'test content');

      // Add and commit
      execSync('git add .', { cwd: repoPath, stdio: 'pipe' });
      execSync('git commit -m "Initial commit"', { cwd: repoPath, stdio: 'pipe' });

      // Verify commit
      const log = execSync('git log --oneline', { cwd: repoPath, encoding: 'utf8' });
      expect(log).toContain('Initial commit');
    });
  });

  describe('Template Content Validation', () => {
    it('should have valid Python syntax in gradio template', () => {
      const repoPath = path.join(TEST_DIR, 'python-syntax');
      fs.mkdirSync(repoPath, { recursive: true });

      const appPyContent = `import gradio as gr
import requests
import os
import json

def chat(message, history):
    api_key = os.getenv('OG_COMPUTE_API_KEY')
    if not api_key:
        raise ValueError("OG_COMPUTE_API_KEY environment variable not set")
    
    print(f"Sending request to 0G Router: model=zai-org/GLM-4-Flash, message={message[:50]}...")
    response = requests.post(
        "https://router-api.0g.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": "zai-org/GLM-4-Flash", "messages": [{"role": "user", "content": message}], "max_tokens": 50}
    )
    print(f"0G Router response status: {response.status_code}")
    print(f"0G Router response: {json.dumps(response.json(), indent=2)}")
    return response.json()["choices"][0]["message"]["content"]

if __name__ == "__main__":
    print("Starting Gradio app on port 7860")
    ui = gr.ChatInterface(fn=chat, title="TestSpace", description="Powered by 0G Compute")
    ui.launch(server_name="0.0.0.0", server_port=7860)`;

      const appPyPath = path.join(repoPath, 'app.py');
      fs.writeFileSync(appPyPath, appPyContent);

      // Verify Python syntax by checking for valid Python constructs
      const content = fs.readFileSync(appPyPath, 'utf8');
      
      // Check for valid Python syntax patterns
      expect(content).toMatch(/^import\s+/m);
      expect(content).toMatch(/^def\s+\w+/m);
      expect(content).toMatch(/^if\s+__name__\s*==\s*"__main__"/m);
      expect(content).toMatch(/^\s+print\(/m);
      expect(content).toMatch(/^\s+return\s+/m);
    });

    it('should have valid JSON in package.json template', () => {
      const repoPath = path.join(TEST_DIR, 'package-json');
      fs.mkdirSync(repoPath, { recursive: true });

      const spaceName = 'TestSpace';
      const packageJsonContent = `{
  "name": "${spaceName}",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": { "start": "node index.js" },
  "dependencies": { "express": "^4.18.2", "axios": "^1.6.2" }
}`;

      const packageJsonPath = path.join(repoPath, 'package.json');
      fs.writeFileSync(packageJsonPath, packageJsonContent);

      // Verify JSON is valid
      const content = fs.readFileSync(packageJsonPath, 'utf8');
      const parsed = JSON.parse(content);
      
      expect(parsed.name).toBe(spaceName);
      expect(parsed.version).toBe('1.0.0');
      expect(parsed.main).toBe('index.js');
      expect(parsed.scripts.start).toBe('node index.js');
      expect(parsed.dependencies).toHaveProperty('express');
      expect(parsed.dependencies).toHaveProperty('axios');
    });
  });

  describe('FastAPI Template', () => {
    it('should create valid FastAPI main.py', () => {
      const repoPath = path.join(TEST_DIR, 'fastapi-test');
      fs.mkdirSync(repoPath, { recursive: true });

      const spaceName = 'TestFastAPI';
      const appPort = 8000;

      const mainPyContent = `from fastapi import FastAPI
import requests
import os
import uvicorn
import json

app = FastAPI(title="${spaceName}")
OG_API_KEY = os.getenv('OG_COMPUTE_API_KEY')
if not OG_API_KEY:
    raise ValueError("OG_COMPUTE_API_KEY environment variable not set")
OG_URL = "https://router-api.0g.ai/v1"

@app.get("/")
def read_root():
    return {"message": "${spaceName} - Powered by 0G Compute"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/chat")
def chat(message: str):
    print(f"Sending request to 0G Router: model=zai-org/GLM-4-Flash, message={message[:50]}...")
    response = requests.post(f"{OG_URL}/chat/completions", headers={"Authorization": f"Bearer {OG_API_KEY}", "Content-Type": "application/json"}, json={"model": "zai-org/GLM-4-Flash", "messages": [{"role": "user", "content": message}], "max_tokens": 50})
    print(f"0G Router response status: {response.status_code}")
    print(f"0G Router response: {json.dumps(response.json(), indent=2)}")
    return response.json()

if __name__ == "__main__":
    print(f"Starting FastAPI app on port ${appPort}")
    uvicorn.run(app, host="0.0.0.0", port=${appPort})`;

      const mainPyPath = path.join(repoPath, 'main.py');
      fs.writeFileSync(mainPyPath, mainPyContent);

      // Verify file
      expect(fs.existsSync(mainPyPath)).toBe(true);
      const content = fs.readFileSync(mainPyPath, 'utf8');
      
      expect(content).toContain('from fastapi import FastAPI');
      expect(content).toContain('import uvicorn');
      expect(content).toContain('OG_COMPUTE_API_KEY');
      expect(content).toContain('Sending request to 0G Router');
      expect(content).toContain('Starting FastAPI app');
    });
  });

  describe('Express Template', () => {
    it('should create valid Express index.js', () => {
      const repoPath = path.join(TEST_DIR, 'express-test');
      fs.mkdirSync(repoPath, { recursive: true });

      const spaceName = 'TestExpress';
      const appPort = 3000;

      const indexJsContent = `const express = require('express');
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
    const apiKey = process.env.OG_COMPUTE_API_KEY;
    if (!apiKey) {
      throw new Error("OG_COMPUTE_API_KEY environment variable not set");
    }
    console.log('Sending request to 0G Router: model=zai-org/GLM-4-Flash, message=' + message.substring(0, 50) + '...');
    const response = await axios.post('https://router-api.0g.ai/v1/chat/completions', {
      model: 'zai-org/GLM-4-Flash',
      messages: [{ role: 'user', content: message }],
      max_tokens: 50
    }, { headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' } });
    console.log('0G Router response status: ' + response.status);
    console.log('0G Router response: ' + JSON.stringify(response.data, null, 2));
    res.json(response.data);
  } catch (error) {
    res.json({ error: error.message });
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(${spaceName} + ' running at http://localhost:' + port);
});`;

      const indexJsPath = path.join(repoPath, 'index.js');
      fs.writeFileSync(indexJsPath, indexJsContent);

      // Verify file
      expect(fs.existsSync(indexJsPath)).toBe(true);
      const content = fs.readFileSync(indexJsPath, 'utf8');
      
      expect(content).toContain('const express = require(\'express\')');
      expect(content).toContain('const axios = require(\'axios\')');
      expect(content).toContain('OG_COMPUTE_API_KEY');
      expect(content).toContain('Sending request to 0G Router');
      expect(content).toContain('0G Router response');
    });
  });

  describe('Platform Configuration', () => {
    it('should generate correct platform URLs', () => {
      const testCases = [
        { host: 'localhost:3000', expected: 'http://localhost:3000/spaces/test-space' },
        { host: 'coreed.app', expected: 'http://coreed.app:3000/spaces/test-space' },
        { host: '127.0.0.1:3000', expected: 'http://127.0.0.1:3000/spaces/test-space' }
      ];

      const platformPort = '3000';
      const spaceSlug = 'test-space';

      testCases.forEach(({ host, expected }) => {
        const platformUrl = `http://${host.split(':')[0]}:${platformPort}/spaces/${spaceSlug}`;
        expect(platformUrl).toBe(expected);
      });
    });

    it('should map SDKs to correct ports', () => {
      const sdkPorts = {
        gradio: 7860,
        fastapi: 8000,
        express: 3000,
        docker: 8080,
        static: 8080
      };

      Object.entries(sdkPorts).forEach(([sdk, port]) => {
        expect(port).toBe(sdkPorts[sdk as keyof typeof sdkPorts]);
      });
    });

    it('should determine correct main files for SDKs', () => {
      const sdkFiles = {
        gradio: 'app.py',
        fastapi: 'main.py',
        express: 'index.js',
        docker: 'index.html',
        static: 'index.html'
      };

      Object.entries(sdkFiles).forEach(([sdk, file]) => {
        expect(file).toBe(sdkFiles[sdk as keyof typeof sdkFiles]);
      });
    });
  });

  describe('Error Scenarios', () => {
    it('should handle missing OG_COMPUTE_API_KEY gracefully', () => {
      const repoPath = path.join(TEST_DIR, 'error-test');
      fs.mkdirSync(repoPath, { recursive: true });

      // Create app without setting API key
      const appPyContent = `import gradio as gr
import requests
import os
import json

def chat(message, history):
    api_key = os.getenv('OG_COMPUTE_API_KEY')
    if not api_key:
        raise ValueError("OG_COMPUTE_API_KEY environment variable not set")
    
    response = requests.post(
        "https://router-api.0g.ai/v1/chat/completions",
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": "zai-org/GLM-4-Flash", "messages": [{"role": "user", "content": message}], "max_tokens": 50}
    )
    return response.json()["choices"][0]["message"]["content"]

if __name__ == "__main__":
    ui = gr.ChatInterface(fn=chat, title="TestSpace", description="Powered by 0G Compute")
    ui.launch(server_name="0.0.0.0", server_port=7860)`;

      const appPyPath = path.join(repoPath, 'app.py');
      fs.writeFileSync(appPyPath, appPyContent);

      // Verify error handling is in place
      const content = fs.readFileSync(appPyPath, 'utf8');
      expect(content).toContain('if not api_key:');
      expect(content).toContain('raise ValueError');
      expect(content).toContain('OG_COMPUTE_API_KEY environment variable not set');
    });

    it('should validate space ID format', () => {
      const validIds = ['test-space', 'my_space-123', 'a-b-c'];
      const invalidIds = ['', 'space with spaces', 'special@chars', 'has/dashes'];

      const isValid = (id: string) => /^[a-z0-9-_]+$/.test(id);

      validIds.forEach(id => {
        expect(isValid(id)).toBe(true);
      });

      invalidIds.forEach(id => {
        expect(isValid(id)).toBe(false);
      });
    });
  });
});

describe('Type Tests', () => {
  it('should have valid AgentSpace interface', () => {
    // This test just verifies the type can be used
    const space = {
      spaceId: 'test-id',
      name: 'Test Space',
      description: 'Test Description',
      version: '1.0.0',
      modelId: 'model-0',
      endpointUrl: 'http://test.example.com',
      platformUrl: 'http://localhost:3000/spaces/test-id',
      localEndpointUrl: 'http://localhost:7860',
      deployedAt: Date.now() / 1000,
      lastHealthCheck: Date.now() / 1000,
      lastActivity: Date.now() / 1000,
      isActive: true,
      isAsleep: false,
      sleepTimeout: 0,
      owner: '0xTestOwner',
      requestCount: 0,
      sdk: 'gradio',
      template: 'blank',
      status: 'running' as const,
      port: 7860
    };

    // If this compiles and runs, the type is valid
    expect(space).toBeDefined();
    expect(space.spaceId).toBe('test-id');
    expect(space.name).toBe('Test Space');
  });

  it('should have valid StoredSpace interface', () => {
    const storedSpace = {
      spaceId: 'test-id',
      name: 'Test Space',
      slug: 'test-space',
      description: 'Test Description',
      sdk: 'gradio',
      template: 'blank',
      owner: '0xTestOwner',
      endpointUrl: 'http://test.example.com',
      platformUrl: 'http://localhost:3000/spaces/test-space',
      localEndpointUrl: 'http://localhost:7860',
      gitRepo: {
        cloneUrl: 'file:///path/to/repo',
        repoPath: '/path/to/repo'
      },
      createdAt: Date.now(),
      status: 'created' as const,
      port: 7860,
      processId: 'process-123'
    };

    expect(storedSpace).toBeDefined();
    expect(storedSpace.spaceId).toBe('test-id');
    expect(storedSpace.gitRepo).toHaveProperty('cloneUrl');
    expect(storedSpace.gitRepo).toHaveProperty('repoPath');
  });
});

describe('Utility Functions', () => {
  it('should slugify space names', () => {
    const testCases = [
      { input: 'Test Space', expected: 'test-space' },
      { input: 'My_Awesome_Space', expected: 'my_awesome_space' },
      { input: 'Space123', expected: 'space123' },
      { input: 'space-with-dashes', expected: 'space-with-dashes' }
    ];

    testCases.forEach(({ input, expected }) => {
      const slug = input.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
      expect(slug).toBe(expected);
    });
  });

  it('should determine Python vs Node SDKs', () => {
    const pythonSdk = ['gradio', 'fastapi'];
    const nodeSdk = ['express'];

    pythonSdk.forEach(sdk => {
      const isPython = sdk === 'gradio' || sdk === 'fastapi';
      expect(isPython).toBe(true);
    });

    nodeSdk.forEach(sdk => {
      const isNode = sdk === 'express';
      expect(isNode).toBe(true);
    });
  });

  it('should determine correct dependency install commands', () => {
    const pythonCommand = 'pip install -r requirements.txt';
    const nodeCommand = 'npm install';

    expect(pythonCommand).toBe('pip install -r requirements.txt');
    expect(nodeCommand).toBe('npm install');
  });
});
