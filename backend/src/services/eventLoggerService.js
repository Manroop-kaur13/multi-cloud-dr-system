import { insertSystemEvent, listSystemEvents } from '../database/repositories/eventRepo.js';

export async function logSystemEvent({ eventType, severity, source, message, metadata = null }) {
  return insertSystemEvent({
    eventType,
    severity,
    source,
    message,
    metadata,
  });
}

export async function getSystemEvents({ eventType = 'ALL', severity = 'ALL', limit = 50 } = {}) {
  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  return listSystemEvents({ eventType, severity, limit: safeLimit });
}
