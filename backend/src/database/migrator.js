import fs from 'node:fs/promises';
import { env } from '../config/env.js';
import { initializeDatabaseClient, query } from './dbClient.js';

function splitSqlStatements(sqlText) {
  return sqlText
    .split(/;\s*(?:\r?\n|$)/)
    .map((stmt) =>
      stmt
        .split(/\r?\n/)
        .filter((line) => !line.trim().startsWith('--'))
        .join('\n')
        .trim()
    )
    .filter((stmt) => stmt.length > 0);
}

export async function runMigrationsAndSeed() {
  await initializeDatabaseClient();

  const schemaSql = await fs.readFile(env.paths.schemaSql, 'utf8');
  for (const statement of splitSqlStatements(schemaSql)) {
    await query(statement);
  }

  const existing = await query('SELECT COUNT(*) AS total FROM health_checks');
  if (Number(existing.rows[0]?.total || 0) === 0) {
    const seedSql = await fs.readFile(env.paths.seedSql, 'utf8');
    for (const statement of splitSqlStatements(seedSql)) {
      await query(statement);
    }
  }
}
