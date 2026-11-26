import { getSystemMetrics } from '../services/metricsService.js';

export async function getMetrics(req, res, next) {
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 40, 5), 120);
    const metrics = await getSystemMetrics(limit);
    res.json(metrics);
  } catch (err) {
    next(err);
  }
}
