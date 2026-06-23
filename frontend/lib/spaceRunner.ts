import { exec, spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';

interface SpaceProcess {
  process: ChildProcess;
  repoPath: string;
  port: number;
  sdk: string;
}

const runningSpaces = new Map<string, SpaceProcess>();

const SDK_PORTS: Record<string, number> = {
  gradio: 7860,
  fastapi: 8000,
  express: 3000,
  docker: 8080,
  static: 8080
};

export const installDependencies = (repoPath: string, sdk: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const packageManager = sdk === 'gradio' || sdk === 'fastapi' ? 'pip' : 'npm';
    const command = sdk === 'gradio' || sdk === 'fastapi' 
      ? 'pip install -r requirements.txt'
      : 'npm install';

    console.log(`Installing dependencies for ${sdk} space at ${repoPath}`);
    
    const installProcess = exec(command, { 
      cwd: repoPath
    });

    installProcess.stdout?.on('data', (data) => {
      console.log(`Install stdout: ${data}`);
    });

    installProcess.stderr?.on('data', (data) => {
      console.error(`Install stderr: ${data}`);
    });

    installProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`Dependencies installed successfully for ${repoPath}`);
        resolve('Dependencies installed');
      } else {
        console.error(`Failed to install dependencies for ${repoPath}, code: ${code}`);
        resolve(`Dependency installation failed with code ${code}`);
      }
    });

    installProcess.on('error', (err) => {
      console.error(`Error installing dependencies: ${err.message}`);
      resolve(`Error: ${err.message}`);
    });
  });
};

export const startSpace = (spaceId: string, repoPath: string, sdk: string): Promise<{ success: boolean; port: number; error?: string }> => {
  return new Promise((resolve) => {
    if (runningSpaces.has(spaceId)) {
      const existing = runningSpaces.get(spaceId);
      if (existing) {
        resolve({ success: true, port: existing.port });
      }
      return;
    }

    const port = SDK_PORTS[sdk] || 8080;

      // Install dependencies first
      installDependencies(repoPath, sdk).then(() => {
        // Stop any other running spaces right before spawning to free up ports and resources
        for (const [id, spaceProc] of runningSpaces.entries()) {
          if (id !== spaceId) {
            console.log(`Stopping running space ${id} to free up port/resources for ${spaceId}`);
            try {
              spaceProc.process.kill('SIGTERM');
            } catch (e) {
              console.error(`Error killing process for space ${id}:`, e);
            }
            runningSpaces.delete(id);
          }
        }

        const mainFile = sdk === 'gradio' ? 'app.py' :
                         sdk === 'fastapi' ? 'main.py' :
                         sdk === 'express' ? 'index.js' :
                         'index.html';

        const mainPath = path.join(repoPath, mainFile);

        if (!fs.existsSync(mainPath)) {
          resolve({ success: false, port, error: `Main file ${mainFile} not found` });
          return;
        }

        // Load space-specific .env file if it exists
        const spaceEnv: Record<string, string> = {};
        const envPath = path.join(repoPath, '.env');
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

        const command = sdk === 'gradio' || sdk === 'fastapi' ? 'python' : 'node';
        const script = mainFile;

        console.log(`Starting space ${spaceId} with ${command} ${script} on port ${port}`);

        const spaceProcess = spawn(command, [script], {
          cwd: repoPath,
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
            resolve({ success: false, port, error: 'Space failed to start within timeout' });
          }
        }, 35000);

      spaceProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log(`Space ${spaceId} stdout: ${output}`);
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
          runningSpaces.set(spaceId, { process: spaceProcess, repoPath, port, sdk });
          resolve({ success: true, port });
        }
      });

      spaceProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        console.error(`Space ${spaceId} stderr: ${error}`);
      });

      spaceProcess.on('close', (code) => {
        clearTimeout(timeout);
        runningSpaces.delete(spaceId);
        console.log(`Space ${spaceId} process closed with code ${code}`);
      });

      spaceProcess.on('error', (err) => {
        clearTimeout(timeout);
        console.error(`Space ${spaceId} process error: ${err.message}`);
        resolve({ success: false, port, error: err.message });
      });
    });
  });
};

export const stopSpace = (spaceId: string): boolean => {
  const spaceProcess = runningSpaces.get(spaceId);
  if (spaceProcess) {
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
