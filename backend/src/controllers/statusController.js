import { env } from '../config/env.js';
import { getDbStatus } from '../database/dbClient.js';
import { drState } from '../services/drState.js';
import { getSystemEvents } from '../services/eventLoggerService.js';
import { getFailoverTimeline } from '../services/failoverService.js';
import { getSystemMetrics } from '../services/metricsService.js';

export async function getSystemStatus(_req, res, next) {
  try {
    const [metrics, recentEvents, failoverTimeline] = await Promise.all([
      getSystemMetrics(24),
      getSystemEvents({ limit: 8 }),
      getFailoverTimeline(10),
    ]);

    res.json({
      serviceName: 'Multi-Cloud Disaster Recovery & Automated Failover System',
      simulationMode: env.simulationMode,
      activeCloud: drState.activeCloud,
      autoFailoverEnabled: drState.autoFailoverEnabled,
      failureThreshold: drState.failureThreshold,
      checkIntervalMs: drState.checkIntervalMs,
      overallAvailabilityPercent: metrics.overallAvailabilityPercent,
      rtoTargetSeconds: drState.rtoTargetSeconds,
      rpoTargetSeconds: drState.rpoTargetSeconds,
      clouds: drState.clouds,
      failover: drState.failover,
      database: getDbStatus(),
      recentEvents,
      failoverTimeline,
      lastCheckAt: drState.lastCheckAt,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export function getActiveCloud(_req, res) {
  const activeNode = drState.clouds[drState.activeCloud];
  res.json({
    activeCloud: drState.activeCloud,
    role: activeNode.role,
    region: activeNode.region,
    endpoint: activeNode.endpoint,
    status: activeNode.status,
    mode: drState.activeCloud === 'AWS' ? 'PRIMARY_ACTIVE' : 'STANDBY_PROMOTED',
    failoverStatus: drState.failover.status,
    servedAt: new Date().toISOString(),
  });
}
