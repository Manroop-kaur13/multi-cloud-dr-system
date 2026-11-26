import pg from 'pg';
import { newDb } from 'pg-mem';
import { env } from '../config/env.js';
import { buildPgPoolConfig } from '../config/database.js';

const { Pool } = pg;

let activePool = null;
let dbState = {
  mode: 'uninitialized',
  engineLabel: 'Uninitialized',
  connected: false,
  host: env.db.host,
  port: env.db.port,
  database: env.db.database,
  lastError: null,
};

function createInMemoryPool() {
  const mem = newDb({ autoCreateForeignKeyIndices: true });
  const pgAdapter = mem.adapters.createPg();
  return new pgAdapter.Pool();
}

export async function initializeDatabaseClient() {
  if (activePool && dbState.connected) {
    return activePool;
  }

  if (env.db.mode === 'memory') {
    activePool = createInMemoryPool();
    dbState = {
      mode: 'memory-fallback',
      engineLabel: 'In-Memory PostgreSQL Simulation (pg-mem)',
      connected: true,
      host: 'in-memory',
      port: 0,
      database: env.db.database,
      lastError: null,
    };
    return activePool;
  }

  const pool = new Pool(buildPgPoolConfig());
  try {
    await pool.query('SELECT 1 AS ok');
    activePool = pool;
    dbState = {
      mode: 'postgres',
      engineLabel: 'PostgreSQL (node-postgres)',
      connected: true,
      host: env.db.connectionString ? 'DATABASE_URL' : env.db.host,
      port: env.db.port,
      database: env.db.database,
      lastError: null,
    };
    return activePool;
  } catch (err) {
    await pool.end().catch(() => {});
    if (env.db.mode === 'postgres') {
      dbState = {
        mode: 'postgres',
        engineLabel: 'PostgreSQL (Disconnected)',
        connected: false,
        host: env.db.host,
        port: env.db.port,
        database: env.db.database,
        lastError: err.message,
      };
      throw new Error(`Failed to connect to PostgreSQL in strict mode: ${err.message}`);
    }

    console.warn(
      `[DB] PostgreSQL unreachable (${err.message}). Starting local pg-mem PostgreSQL simulation for development.`
    );
    activePool = createInMemoryPool();
    dbState = {
      mode: 'memory-fallback',
      engineLabel: 'In-Memory PostgreSQL Fallback (pg-mem)',
      connected: true,
      host: 'in-memory',
      port: 0,
      database: env.db.database,
      lastError: err.message,
    };
    return activePool;
  }
}

export async function query(text, params = []) {
  if (!activePool) {
    await initializeDatabaseClient();
  }
  return activePool.query(text, params);
}

export function getDbStatus() {
  return { ...dbState };
}

export async function closeDatabaseClient() {
  if (activePool && typeof activePool.end === 'function') {
    await activePool.end().catch(() => {});
  }
  activePool = null;
  dbState.connected = false;
}
