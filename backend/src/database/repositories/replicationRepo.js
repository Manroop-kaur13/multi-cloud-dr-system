import { query } from '../dbClient.js';

export async function getLatestReplicationStatus() {
  const result = await query(
    `SELECT id, primary_db_status, secondary_db_status, replication_mode, lag_ms, estimated_rpo_seconds, records_synced, pending_wal_records, last_sync_at
     FROM replication_status
     ORDER BY id DESC
     LIMIT 1`
  );
  return result.rows[0] || null;
}

export async function updateReplicationStatus({
  primaryDbStatus,
  secondaryDbStatus,
  replicationMode,
  lagMs,
  estimatedRpoSeconds,
  recordsSynced,
  pendingWalRecords,
}) {
  const latest = await getLatestReplicationStatus();
  if (!latest) {
    const inserted = await query(
      `INSERT INTO replication_status (
        primary_db_status, secondary_db_status, replication_mode, lag_ms, estimated_rpo_seconds, records_synced, pending_wal_records, last_sync_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *`,
      [
        primaryDbStatus,
        secondaryDbStatus,
        replicationMode,
        lagMs,
        estimatedRpoSeconds,
        recordsSynced,
        pendingWalRecords,
      ]
    );
    return inserted.rows[0];
  }

  const updated = await query(
    `UPDATE replication_status
     SET primary_db_status = $1,
         secondary_db_status = $2,
         replication_mode = $3,
         lag_ms = $4,
         estimated_rpo_seconds = $5,
         records_synced = $6,
         pending_wal_records = $7,
         last_sync_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [
      primaryDbStatus,
      secondaryDbStatus,
      replicationMode,
      lagMs,
      estimatedRpoSeconds,
      recordsSynced,
      pendingWalRecords,
      latest.id,
    ]
  );
  return updated.rows[0];
}
