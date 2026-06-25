import { Pool } from 'pg';

const connectionString = process.env.DATABASE_URL;
const hasDb = !!connectionString;

export const pool = hasDb 
  ? new Pool({ connectionString }) 
  : null;

if (pool) {
  pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client:', err);
  });
}

let initPromise: Promise<void> | null = null;

export async function initDb() {
  if (!pool) {
    console.warn('DATABASE_URL is not set. Database operations will fail.');
    return;
  }

  if (initPromise) return initPromise;

  initPromise = (async () => {
    const client = await pool.connect();
    try {
      console.log('[Postgres] Checking schema migrations...');
      
      // Create users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          privy_user_id VARCHAR(255),
          wallet_address VARCHAR(255),
          wallet_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create spaces table
      await client.query(`
        CREATE TABLE IF NOT EXISTS spaces (
          space_id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          slug VARCHAR(255) NOT NULL,
          description TEXT,
          sdk VARCHAR(64) NOT NULL,
          template VARCHAR(64),
          owner VARCHAR(255) NOT NULL,
          endpoint_url TEXT,
          platform_url TEXT,
          local_endpoint_url TEXT,
          git_repo_clone_url TEXT,
          git_repo_path TEXT,
          created_at BIGINT,
          status VARCHAR(64),
          port INTEGER,
          process_id VARCHAR(64),
          storage_root_hash VARCHAR(255),
          storage_tx_hash VARCHAR(255),
          is_asleep BOOLEAN DEFAULT FALSE,
          sleep_timeout INTEGER DEFAULT 300,
          last_activity BIGINT DEFAULT 0
        );
      `);

      // Ensure columns exist on already created tables
      await client.query(`
        ALTER TABLE spaces ADD COLUMN IF NOT EXISTS is_asleep BOOLEAN DEFAULT FALSE;
        ALTER TABLE spaces ADD COLUMN IF NOT EXISTS sleep_timeout INTEGER DEFAULT 300;
        ALTER TABLE spaces ADD COLUMN IF NOT EXISTS last_activity BIGINT DEFAULT 0;
      `);

      console.log('[Postgres] Schema tables verified & migrated.');
    } catch (err: any) {
      console.error('[Postgres] Migration failed:', err.message);
      initPromise = null; // allow retry
      throw err;
    } finally {
      client.release();
    }
  })();

  return initPromise;
}

export async function query(text: string, params?: any[]) {
  if (!pool) {
    throw new Error('Database pool not initialized. Configure DATABASE_URL in environment.');
  }
  // Await the tables initialization to avoid "relation users/spaces does not exist" race conditions
  await initDb();
  return pool.query(text, params);
}

// Trigger auto-init on boot in backend contexts
if (pool) {
  initDb().catch(err => {
    console.error('[Postgres] Auto-init failed:', err.message);
  });
}
