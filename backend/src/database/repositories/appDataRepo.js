import { query } from '../dbClient.js';

export async function listReplicatedRecords(limit = 15) {
  const result = await query(
    `SELECT id, record_key, payload, source_cloud, primary_synced, secondary_synced, created_at, replicated_at
     FROM replicated_records
     ORDER BY id DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}

export async function insertReplicatedRecord({ recordKey, payload, sourceCloud, primarySynced = true, secondarySynced = false }) {
  const result = await query(
    `INSERT INTO replicated_records (record_key, payload, source_cloud, primary_synced, secondary_synced, created_at, replicated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), $6)
     RETURNING *`,
    [
      recordKey,
      payload,
      sourceCloud,
      primarySynced,
      secondarySynced,
      secondarySynced ? new Date() : null,
    ]
  );
  return result.rows[0];
}

export async function markAllRecordsReplicatedToBoth() {
  const result = await query(
    `UPDATE replicated_records
     SET primary_synced = TRUE,
         secondary_synced = TRUE,
         replicated_at = COALESCE(replicated_at, NOW())
     WHERE primary_synced = FALSE OR secondary_synced = FALSE
     RETURNING id`
  );
  return result.rowCount || result.rows.length;
}

export async function countReplicatedRecords() {
  const result = await query(`SELECT COUNT(*) AS total FROM replicated_records`);
  return Number(result.rows[0]?.total || 0);
}
