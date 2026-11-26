import { probeAwsPrimary } from '../cloud/awsHealthCheck.js';
import { probeGcpSecondary } from '../cloud/gcpHealthCheck.js';
import {
  getLastSuccessfulHealthByProvider,
  insertHealthCheck,
} from '../database/repositories/healthCheckRepo.js';
import { drState } from './drState.js';
import { logSystemEvent } from './eventLoggerService.js';
import { syncReplicationState } from './replicationService.js';

let monitorTimer = null;
let autoFailoverHandler = null;

export function registerAutoFailoverHandler(handler) {
  autoFailoverHandler = handler;
}

async function applyProbeResult(provider, probe) {
  const cloud = drState.clouds[provider];
  const previousStatus = cloud.status;

  cloud.status = probe.status;
  cloud.httpStatus = probe.httpStatus;
  cloud.responseTimeMs = probe.responseTimeMs;
  cloud.errorMessage = probe.errorMessage;
  cloud.lastCheckedAt = probe.checkedAt;

  if (probe.status === 'HEALTHY') {
    cloud.consecutiveFailures = 0;
    cloud.lastSuccessfulCheckAt = probe.checkedAt;
  } else if (probe.status === 'UNHEALTHY') {
    cloud.consecutiveFailures += 1;
  } else if (probe.status === 'DEGRADED') {
    cloud.consecutiveFailures = Math.max(cloud.consecutiveFailures, 0);
  }

  await insertHealthCheck({
    provider: probe.provider,
    region: probe.region,
    status: probe.status,
    responseTimeMs: probe.responseTimeMs,
    httpStatus: probe.httpStatus,
    errorMessage: probe.errorMessage,
  });

  if (probe.status === 'UNHEALTHY') {
    await logSystemEvent({
      eventType: 'HEALTH_CHECK_FAILURE',
      severity: 'CRITICAL',
      source: `${provider}_MONITOR`,
      message: `${provider} (${probe.region}) health probe failed (HTTP ${probe.httpStatus}, consecutive failures: ${cloud.consecutiveFailures}/${drState.failureThreshold}).`,
      metadata: {
        provider,
        region: probe.region,
        consecutiveFailures: cloud.consecutiveFailures,
        httpStatus: probe.httpStatus,
      },
    });
  } else if (previousStatus === 'UNHEALTHY' && probe.status === 'HEALTHY') {
    await logSystemEvent({
      eventType: 'HEALTH_CHECK_RECOVERY',
      severity: 'SUCCESS',
      source: `${provider}_MONITOR`,
      message: `${provider} (${probe.region}) health check returned to HEALTHY (${probe.responseTimeMs} ms).`,
      metadata: { provider, region: probe.region, responseTimeMs: probe.responseTimeMs },
    });
  }
}

export async function runHealthCheckCycle() {
  const [awsProbe, gcpProbe] = await Promise.all([
    probeAwsPrimary(drState.clouds.AWS.simulation),
    probeGcpSecondary(drState.clouds.GCP.simulation),
  ]);

  await Promise.all([
    applyProbeResult('AWS', awsProbe),
    applyProbeResult('GCP', gcpProbe),
  ]);

  drState.lastCheckAt = new Date().toISOString();
  await syncReplicationState({ logEvent: false });

  // Automatic failover detection when Primary (AWS) breaches failure threshold
  const awsCloud = drState.clouds.AWS;
  const gcpCloud = drState.clouds.GCP;

  if (
    drState.autoFailoverEnabled &&
    drState.activeCloud === 'AWS' &&
    !drState.failover.inProgress &&
    awsCloud.status === 'UNHEALTHY' &&
    awsCloud.consecutiveFailures >= drState.failureThreshold &&
    gcpCloud.status !== 'UNHEALTHY' &&
    autoFailoverHandler
  ) {
    await autoFailoverHandler({
      reason: `Automated health monitor detected ${awsCloud.consecutiveFailures} consecutive failures on AWS Primary (${awsCloud.region}).`,
      stepDelayMs: 250,
    });
  }

  return {
    checkedAt: drState.lastCheckAt,
    aws: awsProbe,
    gcp: gcpProbe,
    activeCloud: drState.activeCloud,
  };
}

export async function hydrateLastSuccessTimestamps() {
  const [awsLast, gcpLast] = await Promise.all([
    getLastSuccessfulHealthByProvider('AWS'),
    getLastSuccessfulHealthByProvider('GCP'),
  ]);
  if (awsLast?.checked_at) {
    drState.clouds.AWS.lastSuccessfulCheckAt = new Date(awsLast.checked_at).toISOString();
  }
  if (gcpLast?.checked_at) {
    drState.clouds.GCP.lastSuccessfulCheckAt = new Date(gcpLast.checked_at).toISOString();
  }
}

export function startHealthMonitorLoop() {
  if (monitorTimer) return;
  monitorTimer = setInterval(() => {
    runHealthCheckCycle().catch((err) => {
      console.error('[HealthMonitor] Periodic check error:', err.message);
    });
  }, drState.checkIntervalMs);
  if (typeof monitorTimer.unref === 'function') {
    monitorTimer.unref();
  }
}

export function stopHealthMonitorLoop() {
  if (monitorTimer) {
    clearInterval(monitorTimer);
    monitorTimer = null;
  }
}
