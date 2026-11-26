import { getSystemEvents } from '../services/eventLoggerService.js';
import { getFailoverTimeline } from '../services/failoverService.js';

export async function getEvents(req, res, next) {
  try {
    const eventType = String(req.query.type || 'ALL').toUpperCase();
    const severity = String(req.query.severity || 'ALL').toUpperCase();
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 200);

    const [events, failoverHistory] = await Promise.all([
      getSystemEvents({ eventType, severity, limit }),
      getFailoverTimeline(20),
    ]);

    res.json({
      events,
      failoverHistory,
      filters: { eventType, severity, limit },
    });
  } catch (err) {
    next(err);
  }
}
