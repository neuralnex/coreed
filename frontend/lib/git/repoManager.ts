/**
 * Git Repository Manager for Coreed Agent Spaces
 * 
 * Manages Git repositories stored on the server filesystem.
 * Each space has its own Git repo at: storage/repos/{owner}/{space-name}/
 * 
 * Workflow:
 * 1. createRepo() - Creates bare repo when space is created
 * 2. Developer clones, adds code, pushes
 * 3. Post-receive hook triggers build
 * 4. Space is deployed
 */

import fs from 'fs';
import path from 'path';
import { execSync, spawn, type ExecSyncOptions } from 'child_process';

// Root directory for all space repositories
const REPOS_ROOT = path.join(process.cwd(), 'storage', 'repos');

/**
 * Ensure the repos root directory exists
 */
function ensureReposRoot() {
  if (!fs.existsSync(REPOS_ROOT)) {
    fs.mkdirSync(REPOS_ROOT, { recursive: true });
  }
}

/**
 * Repository configuration
 */
export interface RepoConfig {
  owner: string;
  spaceName: string;
  slug: string;
  repoPath: string;
  gitUrl: string;
  branch: string;
}

/**
 * Create a new Git repository for a space
 */
export function createRepo(owner: string, spaceName: string): RepoConfig {
  ensureReposRoot();
  
  const slug = spaceName.toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const repoPath = path.join(REPOS_ROOT, owner, slug);
  const gitUrl = `file://${repoPath}`;
  
  // Create directory
  fs.mkdirSync(repoPath, { recursive: true });
  
  // Initialize bare repository
  const options: ExecSyncOptions = { cwd: repoPath, stdio: 'pipe' };
  execSync('git init --bare', options);
  
  // Create hooks directory
  const hooksDir = path.join(repoPath, 'hooks');
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }
  
  // Install post-receive hook
  installPostReceiveHook(repoPath, owner, slug);
  
  return {
    owner,
    spaceName,
    slug,
    repoPath,
    gitUrl,
    branch: 'main'
  };
}

/**
 * Install the post-receive hook that triggers builds
 */
function installPostReceiveHook(repoPath: string, owner: string, slug: string) {
  const hooksDir = path.join(repoPath, 'hooks');
  const hookPath = path.join(hooksDir, 'post-receive');
  
  const hookScript = `#!/bin/bash
# Coreed post-receive hook - triggers space build on push

while read oldrev newrev refname; do
  # Only trigger on main branch
  if [ "$refname" = "refs/heads/main" ]; then
    # Get the repo directory
    REPO_DIR=$(dirname $(dirname $(dirname "$0")))
    
    # Call Coreed build API
    curl -X POST http://localhost:${process.env.PORT || 3000}/api/webhooks/git-push \
      -H "Content-Type: application/json" \
      -d "{\"repoPath\": \"$REPO_DIR\", \"owner\": \"${owner}\", \"space\": \"${slug}\"}" &
  fi
done
`;
  
  fs.writeFileSync(hookPath, hookScript);
  fs.chmodSync(hookPath, 0o755); // Make executable
}

/**
 * Get repository info by owner and space name
 */
export function getRepo(owner: string, spaceSlug: string): RepoConfig | null {
  const repoPath = path.join(REPOS_ROOT, owner, spaceSlug);
  
  if (!fs.existsSync(repoPath)) {
    return null;
  }
  
  return {
    owner,
    spaceName: spaceSlug.replace(/-/g, ' '),
    slug: spaceSlug,
    repoPath,
    gitUrl: `file://${repoPath}`,
    branch: 'main'
  };
}

/**
 * List all repositories for an owner
 */
export function listRepos(owner: string): RepoConfig[] {
  const ownerPath = path.join(REPOS_ROOT, owner);
  
  if (!fs.existsSync(ownerPath)) {
    return [];
  }
  
  const spaces = fs.readdirSync(ownerPath);
  
  return spaces.map(spaceSlug => ({
    owner,
    spaceName: spaceSlug.replace(/-/g, ' '),
    slug: spaceSlug,
    repoPath: path.join(ownerPath, spaceSlug),
    gitUrl: `file://${path.join(ownerPath, spaceSlug)}`,
    branch: 'main'
  }));
}

/**
 * Check if a repository exists
 */
export function repoExists(owner: string, spaceSlug: string): boolean {
  const repoPath = path.join(REPOS_ROOT, owner, spaceSlug);
  return fs.existsSync(repoPath);
}

/**
 * Get the Git SSH/HTTP URL for cloning
 * Note: For production, you'd use a proper Git server (gitea, gitlab, etc.)
 * For now, we use file:// URLs which work locally
 */
export function getCloneUrl(repoConfig: RepoConfig): string {
  // For local development, use file:// URL
  // For production, this would be ssh://git@coreed.com/owner/space.git
  return repoConfig.gitUrl;
}

/**
 * Initialize a working copy (for developer to clone and work with)
 * This creates a non-bare repo that developers can use
 */
export function createWorkingCopy(repoPath: string): string {
  const workingPath = `${repoPath}-working`;
  
  // Clone the bare repo
  execSync(`git clone ${repoPath} ${workingPath}`, { stdio: 'pipe' });
  
  return workingPath;
}

/**
 * Get the current HEAD commit of a repo
 */
export function getHeadCommit(repoPath: string): string {
  try {
    const options: ExecSyncOptions = { cwd: repoPath, stdio: 'pipe' };
    return execSync('git rev-parse HEAD', options).toString().trim();
  } catch {
    return '';
  }
}

/**
 * Get the latest commits for a repo
 */
export function getRecentCommits(repoPath: string, count = 5): Array<{
  hash: string;
  message: string;
  author: string;
  date: string;
}> {
  try {
    const options: ExecSyncOptions = { cwd: repoPath, stdio: 'pipe' };
    const output = execSync(
      `git log --pretty=format:"%H|%s|%an|%ad" -n ${count}`,
      options
    ).toString();
    
    return output.trim().split('\n').map(line => {
      const [hash, message, author, date] = line.split('|');
      return { hash, message, author, date };
    });
  } catch {
    return [];
  }
}

/**
 * Cleanup old working copies and temporary files
 */
export function cleanupRepo(repoPath: string) {
  const workingPath = `${repoPath}-working`;
  if (fs.existsSync(workingPath)) {
    fs.rmSync(workingPath, { recursive: true, force: true });
  }
}

// Ensure repos root exists on module load
ensureReposRoot();

export const REPOS_DIRECTORY = REPOS_ROOT;
