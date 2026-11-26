import { query } from '../dbClient.js';

export async function createFailoverEvent({
  eventType,
  fromCloud,
  toCloud,
  triggerReason,
  status = 'IN_PROGRESS',
  rpoEstimatedSeconds = 0,
}) {
  const result = await query(
    `INSERT INTO failover_events (event_type, from_cloud, to_cloud, trigger_reason, status, rpo_estimated_seconds, started_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING *`,
    [eventType, fromCloud, toCloud, triggerReason, status, rpoEstimatedSeconds]
  );
  return result.rows[0];
}

export async function completeFailoverEvent(id, { status, rtoAchievedSeconds, rpoEstimatedSeconds }) {
  const result = await query(
    `UPDATE failover_events
     SET status = $1,
         rto_achieved_seconds = $2,
         rpo_estimated_seconds = $3,
         completed_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [status, rtoAchievedSeconds, rpoEstimatedSeconds, id]
  );
  return result.rows[0] || null;
}

export async function getFailoverHistory(limit = 20) {
  const result = await query(
    `SELECT id, event_type, from_cloud, to_cloud, trigger_reason, status, rto_achieved_seconds, rpo_estimated_seconds, started_at, completed_at
     FROM failover_events
     ORDER BY started_at DESC, id DESC
     LIMIT $1`,
    [limit]
  );
  return result.rows;
}
