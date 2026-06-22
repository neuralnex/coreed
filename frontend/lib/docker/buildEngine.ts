/**
 * Docker Build Engine for Coreed Agent Spaces
 * 
 * Handles building Docker images from Git repositories and managing containers.
 * Each space runs in its own container with the port mapped from the README.md config.
 * 
 * Workflow:
 * 1. Webhook receives git push notification
 * 2. extractSpaceConfig() reads README.md for build instructions
 * 3. buildImage() creates Docker image from repo
 * 4. runContainer() starts the container
 * 5. Space is accessible at http://localhost:{port} or custom domain
 */

import fs from 'fs';
import path from 'path';
import { exec, execSync, spawn } from 'child_process';
import matter from 'gray-matter';
import { RepoConfig } from '../git/repoManager';

/**
 * Space configuration extracted from README.md front-matter
 */
export interface SpaceConfig {
  title: string;
  owner: string;
  sdk: 'gradio' | 'docker' | 'fastapi' | 'express' | 'static';
  template: string;
  app_port: number;
  runtime: 'python' | 'node' | 'docker';
  healthEndpoint?: string;
  model?: string;
  sleepTimeout?: number;
}

/**
 * Container information
 */
export interface ContainerInfo {
  containerId: string;
  containerName: string;
  imageName: string;
  port: number;
  hostPort: number;
  status: 'running' | 'stopped' | 'building' | 'error';
  createdAt: number;
  logs: string[];
}

/**
 * Default ports for different SDKs
 */
const DEFAULT_PORTS: Record<string, number> = {
  gradio: 7860,
  docker: 8080,
  fastapi: 8000,
  express: 3000,
  static: 80
};

/**
 * Active containers (in-memory, use DB in production)
 */
const activeContainers = new Map<string, ContainerInfo>();

/**
 * Extract space configuration from README.md
 */
export function extractSpaceConfig(repoPath: string): Partial<SpaceConfig> {
  const readmePath = path.join(repoPath, 'README.md');
  
  if (!fs.existsSync(readmePath)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(readmePath, 'utf8');
    const { data } = matter(content);
    return data as Partial<SpaceConfig>;
  } catch {
    return {};
  }
}

/**
 * Generate a Dockerfile based on SDK and template
 */
export function generateDockerfile(sdk: string, template?: string): string {
  const templates: Record<string, Record<string, string>> = {
    gradio: {
      default: `FROM python:3.10-slim

WORKDIR /app

# Install Gradio and dependencies
RUN pip install gradio==4.31.0

# Copy app files
COPY . .

# Expose the port (default: 7860)
EXPOSE 7860

# Run Gradio app
CMD ["python", "app.py"]`,
      chatbot: `FROM python:3.10-slim

WORKDIR /app

RUN pip install gradio==4.31.0

COPY . .

EXPOSE 7860

CMD ["python", "chatbot.py"]`
    },
    fastapi: {
      default: `FROM python:3.10-slim

WORKDIR /app

RUN pip install fastapi uvicorn==0.27.0

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]`
    },
    express: {
      default: `FROM node:18-alpine

WORKDIR /app

COPY package.json .
RUN npm install

COPY . .

EXPOSE 3000

CMD ["npm", "start"]`
    },
    docker: {
      default: `# Use the Dockerfile from the repository
FROM scratch`
    },
    static: {
      default: `FROM nginx:alpine

COPY . /usr/share/nginx/html

EXPOSE 80`
    }
  };
  
  return templates[sdk]?.[template || 'default'] || templates[sdk]?.default || templates.gradio.default;
}

/**
 * Build Docker image from a repository
 */
export function buildImage(repoPath: string, owner: string, spaceSlug: string): Promise<{
  imageName: string;
  success: boolean;
  error?: string;
  logs: string[];
}> {
  return new Promise((resolve) => {
    const imageName = `coreed-${owner}-${spaceSlug}:latest`;
    const logs: string[] = [];
    
    // Get space config to check for custom Dockerfile
    const config = extractSpaceConfig(repoPath);
    const dockerfilePath = path.join(repoPath, 'Dockerfile');
    
    // If no custom Dockerfile and config specifies SDK, generate one
    if (!fs.existsSync(dockerfilePath) && config.sdk) {
      const dockerfile = generateDockerfile(config.sdk, config.template);
      fs.writeFileSync(dockerfilePath, dockerfile);
      logs.push(`Generated Dockerfile for ${config.sdk}`);
    }
    
    // Build the image
    const buildProcess = spawn('docker', [
      'build',
      '-t', imageName,
      '-f', dockerfilePath,
      repoPath
    ]);
    
    let stdout = '';
    let stderr = '';
    
    buildProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      logs.push(output);
    });
    
    buildProcess.stderr.on('data', (data) => {
      const output = data.toString();
      stderr += output;
      logs.push(output);
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        resolve({
          imageName,
          success: true,
          logs
        });
      } else {
        resolve({
          imageName,
          success: false,
          error: `Build failed with code ${code}: ${stderr.slice(0, 500)}`,
          logs
        });
      }
    });
    
    buildProcess.on('error', (err) => {
      resolve({
        imageName,
        success: false,
        error: err.message,
        logs
      });
    });
  });
}

/**
 * Run a container from a built image
 */
export function runContainer(
  imageName: string,
  owner: string,
  spaceSlug: string,
  config?: Partial<SpaceConfig>
): Promise<ContainerInfo> {
  return new Promise((resolve) => {
    const containerName = `coreed-${owner}-${spaceSlug}`;
    const port = config?.app_port || DEFAULT_PORTS[config?.sdk || 'gradio'] || 8080;
    const hostPort = port; // Map to same port on host
    
    // Stop and remove any existing container
    try {
      execSync(`docker stop ${containerName} 2>/dev/null || true`);
      execSync(`docker rm ${containerName} 2>/dev/null || true`);
    } catch {}
    
    // Run the container
    const runProcess = spawn('docker', [
      'run',
      '-d',
      '--name', containerName,
      '-p', `${hostPort}:${port}`,
      '--restart', 'unless-stopped',
      imageName
    ]);
    
    let containerId = '';
    let errorOutput = '';
    
    runProcess.stdout.on('data', (data) => {
      containerId = data.toString().trim();
    });
    
    runProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    runProcess.on('close', (code) => {
      if (code === 0 && containerId) {
        const containerInfo: ContainerInfo = {
          containerId,
          containerName,
          imageName,
          port,
          hostPort,
          status: 'running',
          createdAt: Date.now(),
          logs: []
        };
        
        activeContainers.set(containerName, containerInfo);
        resolve(containerInfo);
      } else {
        resolve({
          containerId: '',
          containerName,
          imageName,
          port,
          hostPort,
          status: 'error',
          createdAt: Date.now(),
          logs: [errorOutput || 'Failed to start container']
        });
      }
    });
    
    runProcess.on('error', (err) => {
      resolve({
        containerId: '',
        containerName,
        imageName,
        port,
        hostPort,
        status: 'error',
        createdAt: Date.now(),
        logs: [err.message]
      });
    });
  });
}

/**
 * Stop a running container
 */
export function stopContainer(containerName: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`docker stop ${containerName}`, (error, stdout, stderr) => {
      activeContainers.delete(containerName);
      resolve(!error);
    });
  });
}

/**
 * Remove a container
 */
export function removeContainer(containerName: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(`docker rm ${containerName}`, (error) => {
      activeContainers.delete(containerName);
      resolve(!error);
    });
  });
}

/**
 * Get container logs
 */
export function getContainerLogs(containerName: string, tail = 100): Promise<string[]> {
  return new Promise((resolve) => {
    exec(`docker logs --tail ${tail} ${containerName}`, (error, stdout, stderr) => {
      if (error) {
        resolve([stderr || error.message]);
      } else {
        resolve(stdout.split('\n').filter(line => line.trim()));
      }
    });
  });
}

/**
 * Stream container logs (for SSE)
 */
export function streamContainerLogs(containerName: string, callback: (line: string) => void) {
  const logsProcess = spawn('docker', ['logs', '-f', containerName]);
  
  logsProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line: string) => {
      if (line.trim()) callback(line);
    });
  });
  
  logsProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    lines.forEach((line: string) => {
      if (line.trim()) callback(`[stderr] ${line}`);
    });
  });
  
  logsProcess.on('close', () => {});
  
  return logsProcess;
}

/**
 * Get all active containers
 */
export function getActiveContainers(): ContainerInfo[] {
  return Array.from(activeContainers.values());
}

/**
 * Get container by name
 */
export function getContainer(containerName: string): ContainerInfo | undefined {
  return activeContainers.get(containerName);
}

/**
 * Build and run a space from a repository
 * This is the main function called by the git-push webhook
 */
export async function buildAndRunSpace(
  repoPath: string,
  owner: string,
  spaceSlug: string
): Promise<{
  success: boolean;
  container?: ContainerInfo;
  error?: string;
  buildLogs?: string[];
}> {
  try {
    // Step 1: Extract config from README.md
    const config = extractSpaceConfig(repoPath);
    
    // Step 2: Build Docker image
    const buildResult = await buildImage(repoPath, owner, spaceSlug);
    
    if (!buildResult.success) {
      return {
        success: false,
        error: buildResult.error,
        buildLogs: buildResult.logs
      };
    }
    
    // Step 3: Run container
    const container = await runContainer(
      buildResult.imageName,
      owner,
      spaceSlug,
      config
    );
    
    if (container.status === 'error') {
      return {
        success: false,
        error: container.logs.join('\n')
      };
    }
    
    return {
      success: true,
      container
    };
    
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check if Docker is running
 */
export function checkDocker(): boolean {
  try {
    execSync('docker --version', { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get Docker version info
 */
export function getDockerVersion(): string {
  try {
    return execSync('docker --version', { stdio: 'pipe' }).toString().trim();
  } catch {
    return 'Docker not available';
  }
}
