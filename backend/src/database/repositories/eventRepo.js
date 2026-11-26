import { query } from '../dbClient.js';

export async function insertSystemEvent({
  eventType,
  severity,
  source,
  message,
  metadata = null,
}) {
  const metadataJson = metadata ? JSON.stringify(metadata) : null;
  const result = await query(
    `INSERT INTO system_events (event_type, severity, source, message, metadata_json, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [eventType, severity, source, message, metadataJson]
  );
  return result.rows[0];
}

export async function listSystemEvents({ eventType = 'ALL', severity = 'ALL', limit = 50 } = {}) {
  const conditions = [];
  const params = [];

  if (eventType && eventType !== 'ALL') {
    params.push(eventType);
    conditions.push(`event_type = $${params.length}`);
  }

  if (severity && severity !== 'ALL') {
    params.push(severity);
    conditions.push(`severity = $${params.length}`);
  }

  params.push(limit);
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await query(
    `SELECT id, event_type, severity, source, message, metadata_json, created_at
     FROM system_events
     ${whereClause}
     ORDER BY created_at DESC, id DESC
     LIMIT $${params.length}`,
    params
  );

  return result.rows;
}
