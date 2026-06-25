import { query, pool } from './db';

export interface StoredSpace {
  spaceId: string;
  name: string;
  slug: string;
  description: string;
  sdk: string;
  template: string;
  owner: string;
  endpointUrl: string;
  platformUrl?: string;
  localEndpointUrl?: string;
  gitRepo: {
    cloneUrl: string;
    repoPath: string;
  };
  createdAt: number;
  status: 'created' | 'deployed' | 'error' | 'running';
  port?: number;
  processId?: string;
  storageRootHash?: string;
  storageTxHash?: string;
}

// Fallback in-memory store if DATABASE_URL is not set
const inMemorySpaces = new Map<string, StoredSpace>();

function rowToSpace(row: any): StoredSpace {
  return {
    spaceId: row.space_id,
    name: row.name,
    slug: row.slug,
    description: row.description || '',
    sdk: row.sdk,
    template: row.template || '',
    owner: row.owner,
    endpointUrl: row.endpoint_url || '',
    platformUrl: row.platform_url || '',
    localEndpointUrl: row.local_endpoint_url || '',
    gitRepo: {
      cloneUrl: row.git_repo_clone_url || '',
      repoPath: row.git_repo_path || '',
    },
    createdAt: Number(row.created_at || 0),
    status: row.status as StoredSpace['status'],
    port: row.port || undefined,
    processId: row.process_id || undefined,
    storageRootHash: row.storage_root_hash || undefined,
    storageTxHash: row.storage_tx_hash || undefined,
  };
}

export const getSpacesByOwner = async (owner: string): Promise<StoredSpace[]> => {
  if (!pool) {
    return Array.from(inMemorySpaces.values()).filter(
      (s) => s.owner.toLowerCase() === owner.toLowerCase()
    );
  }
  const res = await query('SELECT * FROM spaces WHERE LOWER(owner) = LOWER($1)', [owner]);
  return res.rows.map(rowToSpace);
};

export const getAllSpaces = async (): Promise<StoredSpace[]> => {
  if (!pool) {
    return Array.from(inMemorySpaces.values());
  }
  const res = await query('SELECT * FROM spaces');
  return res.rows.map(rowToSpace);
};

export const getSpaceById = async (spaceId: string): Promise<StoredSpace | undefined> => {
  if (!pool) {
    return inMemorySpaces.get(spaceId);
  }
  const res = await query('SELECT * FROM spaces WHERE space_id = $1', [spaceId]);
  if (res.rows.length === 0) return undefined;
  return rowToSpace(res.rows[0]);
};

export const addSpace = async (space: StoredSpace): Promise<void> => {
  if (!pool) {
    inMemorySpaces.set(space.spaceId, space);
    return;
  }
  await query(`
    INSERT INTO spaces (
      space_id, name, slug, description, sdk, template, owner, endpoint_url,
      platform_url, local_endpoint_url, git_repo_clone_url, git_repo_path,
      created_at, status, port, process_id, storage_root_hash, storage_tx_hash
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
    ON CONFLICT (space_id) DO UPDATE SET
      name = $2,
      slug = $3,
      description = $4,
      sdk = $5,
      template = $6,
      owner = $7,
      endpoint_url = $8,
      platform_url = $9,
      local_endpoint_url = $10,
      git_repo_clone_url = $11,
      git_repo_path = $12,
      created_at = $13,
      status = $14,
      port = $15,
      process_id = $16,
      storage_root_hash = $17,
      storage_tx_hash = $18
  `, [
    space.spaceId, space.name, space.slug, space.description, space.sdk, space.template, space.owner, space.endpointUrl,
    space.platformUrl, space.localEndpointUrl, space.gitRepo.cloneUrl, space.gitRepo.repoPath,
    space.createdAt, space.status, space.port || null, space.processId || null, space.storageRootHash || null, space.storageTxHash || null
  ]);
};

export const deleteSpace = async (spaceId: string): Promise<boolean> => {
  if (!pool) {
    return inMemorySpaces.delete(spaceId);
  }
  const res = await query('DELETE FROM spaces WHERE space_id = $1', [spaceId]);
  return (res.rowCount ?? 0) > 0;
};

export const updateSpaceStatus = async (spaceId: string, status: StoredSpace['status']): Promise<void> => {
  if (!pool) {
    const space = inMemorySpaces.get(spaceId);
    if (space) {
      space.status = status;
      inMemorySpaces.set(spaceId, space);
    }
    return;
  }
  await query('UPDATE spaces SET status = $1 WHERE space_id = $2', [status, spaceId]);
};
