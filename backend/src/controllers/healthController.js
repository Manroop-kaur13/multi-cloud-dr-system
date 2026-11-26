import { getDbStatus } from '../database/dbClient.js';
import { drState } from '../services/drState.js';

/**
 * Load-balancer compatible health check endpoint.
 * AWS ALB / Route 53 and GCP Cloud Load Balancing can probe GET /api/health
 * or target-specific GET /api/health?target=aws | ?target=gcp.
 */
export function getHealth(req, res) {
  const target = String(req.query.target || '').toUpperCase();
  const dbStatus = getDbStatus();

  if (target === 'AWS' || target === 'GCP') {
    const cloud = drState.clouds[target];
    const healthy = cloud.status !== 'UNHEALTHY';
    return res.status(healthy ? 200 : 503).json({
      status: healthy ? 'UP' : 'DOWN',
      provider: cloud.provider,
      region: cloud.region,
      healthStatus: cloud.status,
      responseTimeMs: cloud.responseTimeMs,
      databaseConnected: dbStatus.connected,
      timestamp: new Date().toISOString(),
    });
  }

  const activeNode = drState.clouds[drState.activeCloud];
  const serviceHealthy = activeNode.status !== 'UNHEALTHY';

  return res.status(serviceHealthy ? 200 : 503).json({
    status: serviceHealthy ? 'UP' : 'DEGRADED',
    activeCloud: drState.activeCloud,
    region: activeNode.region,
    failoverStatus: drState.failover.status,
    databaseConnected: dbStatus.connected,
    databaseMode: dbStatus.mode,
    timestamp: new Date().toISOString(),
  });
}
