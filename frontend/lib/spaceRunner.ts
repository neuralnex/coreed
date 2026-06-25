import { exec, spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { zeroGSpaceManager } from './zeroGSpaceManager';
import { getSpaceById } from './spacesStore';

export interface LogEntry {
  timestamp: string;
  phase: 'build' | 'run' | 'system' | 'error';
  message: string;
}

interface SpaceProcess {
  process: ChildProcess;
  repoPath: string;
  port: number;
  sdk: string;
}

const runningSpaces = new Map<string, SpaceProcess>();
const spaceLogs = new Map<string, LogEntry[]>();

const SDK_PORTS: Record<string, number> = {
  gradio: 7860,
  fastapi: 8000,
  express: 3000,
  docker: 8080,
  static: 8080
};

const REGISTRY_PATH = path.join(process.cwd(), 'storage', 'dependency-cache-registry.json');

// --- Helper Functions ---

function copyFolderRecursiveSync(source: string, target: string) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  const files = fs.readdirSync(source);
  files.forEach((file) => {
    const curSource = path.join(source, file);
    const curTarget = path.join(target, file);

    // Skip git details, environment bindings, and node_modules
    if (
      file === '.git' ||
      file === 'node_modules' ||
      file === '.venv' ||
      file === 'venv' ||
      file === '__pycache__' ||
      file === '.env' ||
      file === '.env.local'
    ) {
      return;
    }

    if (fs.lstatSync(curSource).isDirectory()) {
      copyFolderRecursiveSync(curSource, curTarget);
    } else {
      fs.copyFileSync(curSource, curTarget);
    }
  });
}

function getDependenciesHash(computeNodePath: string, sdk: string): string {
  const file = sdk === 'gradio' || sdk === 'fastapi' ? 'requirements.txt' : 'package.json';
  const filePath = path.join(computeNodePath, file);
  if (!fs.existsSync(filePath)) return '';
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
  } catch {
    return '';
  }
}

function getCacheRegistry(): Record<string, string> {
  if (!fs.existsSync(REGISTRY_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function updateCacheRegistry(depsHash: string, rootHash: string) {
  try {
    const registry = getCacheRegistry();
    registry[depsHash] = rootHash;
    fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf8');
  } catch (err: any) {
    console.error('Failed to update cache registry:', err.message);
  }
}

function getRunnerCommand(computeNodePath: string, sdk: string): { command: string; args: string[] } {
  const mainFile = sdk === 'gradio' ? 'app.py' :
                   sdk === 'fastapi' ? 'main.py' :
                   sdk === 'express' ? 'index.js' :
                   'index.html';
  
  if (sdk === 'gradio' || sdk === 'fastapi') {
    const venvPythonWin = path.join(computeNodePath, '.venv', 'Scripts', 'python.exe');
    const venvPythonWin2 = path.join(computeNodePath, '.venv', 'Scripts', 'python');
    const venvPythonUnix = path.join(computeNodePath, '.venv', 'bin', 'python');
    
    let command = 'python';
    if (fs.existsSync(venvPythonWin)) {
      command = venvPythonWin;
    } else if (fs.existsSync(venvPythonWin2)) {
      command = venvPythonWin2;
    } else if (fs.existsSync(venvPythonUnix)) {
      command = venvPythonUnix;
    }
    return { command, args: [mainFile] };
  } else {
    return { command: 'node', args: [mainFile] };
  }
}

// --- Log Buffer Management ---

export const getSpaceLogs = (spaceId: string): LogEntry[] => {
  return spaceLogs.get(spaceId) || [];
};

export const addSpaceLog = (spaceId: string, phase: LogEntry['phase'], message: string) => {
  const timestamp = new Date().toLocaleTimeString();
  const current = spaceLogs.get(spaceId) || [];
  
  const lines = message.split(/\r?\n/);
  lines.forEach(line => {
    current.push({
      timestamp,
      phase,
      message: line
    });
  });

  if (current.length > 500) {
    current.splice(0, current.length - 500);
  }
  
  spaceLogs.set(spaceId, current);
};

export const clearSpaceLogs = (spaceId: string) => {
  spaceLogs.set(spaceId, []);
};

// --- Execution & Setup Functions ---

export const installDependencies = (repoPath: string, sdk: string, spaceId?: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const logSpaceId = spaceId || 'system';
    const packageManager = sdk === 'gradio' || sdk === 'fastapi' ? 'pip' : 'npm';
    
    // Check if python environment needs creation
    if (sdk === 'gradio' || sdk === 'fastapi') {
      const venvPath = path.join(repoPath, '.venv');
      if (!fs.existsSync(venvPath)) {
        addSpaceLog(logSpaceId, 'build', `[Build] Creating virtual environment (.venv) at compute node...`);
        try {
          execSync(`python -m venv "${venvPath}"`);
        } catch (venvErr: any) {
          addSpaceLog(logSpaceId, 'error', `[Build] Virtual env creation failed: ${venvErr.message}`);
        }
      }
    }

    const pipCmd = process.platform === 'win32' ? '.venv\\Scripts\\pip' : '.venv/bin/pip';
    const command = sdk === 'gradio' || sdk === 'fastapi' 
      ? `"${pipCmd}" install -r requirements.txt`
      : 'npm install';

    addSpaceLog(logSpaceId, 'build', `[Build] Installing dependencies using command: ${command}`);
    
    const installProcess = exec(command, { 
      cwd: repoPath
    });

    installProcess.stdout?.on('data', (data) => {
      addSpaceLog(logSpaceId, 'build', data.toString().trim());
    });

    installProcess.stderr?.on('data', (data) => {
      addSpaceLog(logSpaceId, 'build', data.toString().trim());
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        addSpaceLog(logSpaceId, 'build', `[Build] Dependencies installed successfully.`);
        resolve('Dependencies installed');
      } else {
        addSpaceLog(logSpaceId, 'error', `[Build] Dependency installation failed with code ${code}`);
        resolve(`Dependency installation failed with code ${code}`);
      }
    });

    installProcess.on('error', (err) => {
      addSpaceLog(logSpaceId, 'error', `[Build] Error installing dependencies: ${err.message}`);
      resolve(`Error: ${err.message}`);
    });
  });
};

import { execSync } from 'child_process';

export const startSpace = (spaceId: string, repoPath: string, sdk: string): Promise<{ success: boolean; port: number; error?: string }> => {
  return new Promise(async (resolve) => {
    const isServerless = !!process.env.VERCEL || !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.NETLIFY;
    if (isServerless) {
      console.log(`[Serverless Fallback] Bypassing space runner startup for space: ${spaceId} (running in serverless runtime)`);
      resolve({ success: true, port: SDK_PORTS[sdk] || 8080 });
      return;
    }

    if (runningSpaces.has(spaceId)) {
      const existing = runningSpaces.get(spaceId);
      if (existing) {
        resolve({ success: true, port: existing.port });
      }
      return;
    }

    const port = SDK_PORTS[sdk] || 8080;
    
    // 1. Initialize fresh logs buffer
    clearSpaceLogs(spaceId);
    addSpaceLog(spaceId, 'system', `[System] Starting space deployment flow...`);

    // 2. Setup virtual compute node directory
    const computeNodePath = path.join(process.cwd(), 'storage', 'compute-nodes', spaceId);
    addSpaceLog(spaceId, 'system', `[0G Compute] Provisioning compute node directory: ${computeNodePath}`);

    if (fs.existsSync(computeNodePath)) {
      try {
        fs.rmSync(computeNodePath, { recursive: true, force: true });
      } catch (err: any) {
        addSpaceLog(spaceId, 'system', `[System] Warning: Failed to clean compute node directory: ${err.message}`);
      }
    }
    fs.mkdirSync(computeNodePath, { recursive: true });

    // 3. Download/Restore codebase from 0G Storage using rootHash
    const storedSpace = await getSpaceById(spaceId);
    let restored = false;

    if (storedSpace?.storageRootHash) {
      addSpaceLog(spaceId, 'build', `[0G Storage] Downloading space bundle from 0G Storage (Root Hash: ${storedSpace.storageRootHash})...`);
      try {
        await zeroGSpaceManager.downloadAndUnpack(storedSpace.storageRootHash, computeNodePath);
        addSpaceLog(spaceId, 'build', `[0G Storage] Codebase downloaded & unpacked successfully.`);
        restored = true;
      } catch (err: any) {
        addSpaceLog(spaceId, 'error', `[0G Storage] Error downloading from 0G Storage: ${err.message}`);
      }
    }

    if (!restored) {
      addSpaceLog(spaceId, 'system', `[System] Falling back to copying codebase from local repository storage...`);
      try {
        copyFolderRecursiveSync(repoPath, computeNodePath);
        addSpaceLog(spaceId, 'system', `[System] Copied codebase successfully.`);
      } catch (err: any) {
        addSpaceLog(spaceId, 'error', `[System] Error copying codebase: ${err.message}`);
        resolve({ success: false, port, error: `Codebase restore failed: ${err.message}` });
        return;
      }
    }

    // Copy space .env if it exists in local repo
    const localEnvPath = path.join(repoPath, '.env');
    if (fs.existsSync(localEnvPath)) {
      fs.copyFileSync(localEnvPath, path.join(computeNodePath, '.env'));
    }

    // 4. Resolve and restore dependency cache
    const depsHash = getDependenciesHash(computeNodePath, sdk);
    let cacheRestored = false;
    const computeNodeVenvPath = sdk === 'gradio' || sdk === 'fastapi'
      ? path.join(computeNodePath, '.venv')
      : path.join(computeNodePath, 'node_modules');

    if (depsHash) {
      addSpaceLog(spaceId, 'build', `[0G Storage] Dependencies signature generated: ${depsHash}`);
      const registry = getCacheRegistry();
      const cacheRootHash = registry[depsHash];

      if (cacheRootHash) {
        addSpaceLog(spaceId, 'build', `[0G Storage] Pre-built dependency cache found (Hash: ${cacheRootHash}). Restoring...`);
        cacheRestored = await zeroGSpaceManager.downloadDependencyCache(cacheRootHash, computeNodeVenvPath);
        if (cacheRestored) {
          addSpaceLog(spaceId, 'build', `[0G Storage] Pre-built dependencies cache restored successfully.`);
        } else {
          addSpaceLog(spaceId, 'error', `[0G Storage] Cache download/unpack failed. Will install freshly.`);
        }
      } else {
        addSpaceLog(spaceId, 'build', `[0G Storage] Pre-built dependencies cache not found.`);
      }
    }

    // 5. Fresh installation if cache missed
    if (!cacheRestored && depsHash) {
      addSpaceLog(spaceId, 'build', `[Build] Performing package installation on compute node...`);
      await installDependencies(computeNodePath, sdk, spaceId);
      
      // Pack and upload newly built cache to 0G Storage
      addSpaceLog(spaceId, 'build', `[0G Storage] Packaging and uploading pre-built dependencies cache to 0G Storage...`);
      const uploadResult = await zeroGSpaceManager.uploadDependencyCache(depsHash, computeNodeVenvPath);
      if (uploadResult) {
        updateCacheRegistry(depsHash, uploadResult.rootHash);
        addSpaceLog(spaceId, 'build', `[0G Storage] Dependencies cache committed. Root Hash: ${uploadResult.rootHash}`);
      } else {
        addSpaceLog(spaceId, 'system', `[0G Storage] Warning: Dependencies cache upload failed.`);
      }
    }

    // 6. Stop any other running spaces right before spawning to free up ports and resources
    for (const [id, spaceProc] of runningSpaces.entries()) {
      if (id !== spaceId) {
        addSpaceLog(spaceId, 'system', `[System] Stopping space ${id} to free up port/resources for ${spaceId}`);
        try {
          spaceProc.process.kill('SIGTERM');
        } catch (e) {
          console.error(`Error killing process for space ${id}:`, e);
        }
        runningSpaces.delete(id);
      }
    }

    // Resolve runner executable and file
    const { command, args } = getRunnerCommand(computeNodePath, sdk);
    
    // Load secrets
    const spaceEnv: Record<string, string> = {};
    const envPath = path.join(computeNodePath, '.env');
    if (fs.existsSync(envPath)) {
      try {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split(/\r?\n/).forEach((line) => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const eqIdx = trimmed.indexOf('=');
            const key = trimmed.substring(0, eqIdx).trim();
            const value = trimmed.substring(eqIdx + 1).trim().replace(/^['"]|['"]$/g, '');
            if (key) {
              spaceEnv[key] = value;
            }
          }
        });
      } catch (err) {
        console.error(`Error reading space .env file at ${envPath}:`, err);
      }
    }

    addSpaceLog(spaceId, 'system', `[0G Compute] Starting application node...`);
    addSpaceLog(spaceId, 'system', `[0G Compute] Running: ${path.basename(command)} ${args.join(' ')} on port ${port}`);

    const spaceProcess = spawn(command, args, {
      cwd: computeNodePath,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        ...spaceEnv,
        OG_COMPUTE_API_KEY: spaceEnv.OG_COMPUTE_API_KEY || process.env.OG_COMPUTE_API_KEY || '',
        PATH: process.env.PATH || ''
      }
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        spaceProcess.kill();
        addSpaceLog(spaceId, 'error', `[Error] Space failed to start within timeout limit.`);
        resolve({ success: false, port, error: 'Space failed to start within timeout' });
      }
    }, 45000);

    spaceProcess.stdout?.on('data', (data) => {
      const output = data.toString().trim();
      addSpaceLog(spaceId, 'run', output);
      const lowerOutput = output.toLowerCase();
      if (
        lowerOutput.includes('running') ||
        lowerOutput.includes('local url') ||
        lowerOutput.includes('serving') ||
        lowerOutput.includes('listening') ||
        lowerOutput.includes('started')
      ) {
        started = true;
        clearTimeout(timeout);
        runningSpaces.set(spaceId, { process: spaceProcess, repoPath: computeNodePath, port, sdk });
        resolve({ success: true, port });
      }
    });

    spaceProcess.stderr?.on('data', (data) => {
      const error = data.toString().trim();
      addSpaceLog(spaceId, 'error', error);
    });

    spaceProcess.on('close', (code) => {
      clearTimeout(timeout);
      runningSpaces.delete(spaceId);
      addSpaceLog(spaceId, 'system', `[System] Space process closed with exit code ${code}`);
    });

    spaceProcess.on('error', (err) => {
      clearTimeout(timeout);
      addSpaceLog(spaceId, 'error', `[Error] Spawn error: ${err.message}`);
      resolve({ success: false, port, error: err.message });
    });
  });
};

export const stopSpace = (spaceId: string): boolean => {
  const spaceProcess = runningSpaces.get(spaceId);
  if (spaceProcess) {
    addSpaceLog(spaceId, 'system', `[System] Stopping space process...`);
    spaceProcess.process.kill();
    runningSpaces.delete(spaceId);
    return true;
  }
  return false;
};

export const getRunningSpaces = (): Map<string, SpaceProcess> => {
  return runningSpaces;
};

export const getSpacePort = (spaceId: string): number | undefined => {
  const spaceProcess = runningSpaces.get(spaceId);
  return spaceProcess?.port;
};
