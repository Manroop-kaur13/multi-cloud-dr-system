import { query } from '../dbClient.js';

export async function insertHealthCheck({
  provider,
  region,
  status,
  responseTimeMs,
  httpStatus,
  errorMessage = null,
}) {
  const result = await query(
    `INSERT INTO health_checks (provider, region, status, response_time_ms, http_status, error_message, checked_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [provider, region, status, responseTimeMs, httpStatus, errorMessage]
  );
  return result.rows[0];
}

export async function getRecentHealthChecks(limit = 40) {
  const result = await query(
    `SELECT id, provider, region, status, response_time_ms, http_status, error_message, checked_at
     FROM health_checks
     ORDER BY checked_at DESC, id DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function getLatestHealthByProvider(provider) {
  const result = await query(
    `SELECT id, provider, region, status, response_time_ms, http_status, error_message, checked_at
     FROM health_checks
     WHERE provider = $1
     ORDER BY checked_at DESC, id DESC
     LIMIT 1`,
    [provider]
  );
  return result.rows[0] || null;
}

export async function getLastSuccessfulHealthByProvider(provider) {
  const result = await query(
    `SELECT id, provider, region, status, response_time_ms, http_status, checked_at
     FROM health_checks
     WHERE provider = $1 AND status = 'HEALTHY'
     ORDER BY checked_at DESC, id DESC
     LIMIT 1`,
    [provider]
  );
  return result.rows[0] || null;
}
