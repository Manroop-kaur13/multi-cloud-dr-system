import { getRecentHealthChecks } from '../database/repositories/healthCheckRepo.js';
import { getFailoverHistory } from '../database/repositories/failoverRepo.js';
import { drState } from './drState.js';

export async function getSystemMetrics(limit = 40) {
  const [recentChecks, failoverHistory] = await Promise.all([
    getRecentHealthChecks(limit),
    getFailoverHistory(10),
  ]);

  const orderedChecks = [...recentChecks].reverse();
  const awsChecks = orderedChecks.filter((c) => c.provider === 'AWS');
  const gcpChecks = orderedChecks.filter((c) => c.provider === 'GCP');

  const avgLatency = (rows) => {
    if (!rows.length) return 0;
    const sum = rows.reduce((acc, r) => acc + Number(r.response_time_ms), 0);
    return Math.round(sum / rows.length);
  };

  const healthyRatio = (rows) => {
    if (!rows.length) return 100;
    const okCount = rows.filter((r) => r.status !== 'UNHEALTHY').length;
    return Number(((okCount / rows.length) * 100).toFixed(2));
  };

  // Service availability counts whether at least one active cloud was healthy at each tick
  const totalCheckRounds = Math.max(awsChecks.length, gcpChecks.length, 1);
  let servedRounds = 0;
  for (let i = 0; i < totalCheckRounds; i += 1) {
    const awsOk = awsChecks[i] ? awsChecks[i].status !== 'UNHEALTHY' : false;
    const gcpOk = gcpChecks[i] ? gcpChecks[i].status !== 'UNHEALTHY' : true;
    if (awsOk || gcpOk) servedRounds += 1;
  }
  const overallAvailability = Number(((servedRounds / totalCheckRounds) * 100).toFixed(2));

  // Build paired chart series by chronological index
  const maxLen = Math.max(awsChecks.length, gcpChecks.length);
  const latencySeries = [];
  for (let i = 0; i < maxLen; i += 1) {
    const awsRow = awsChecks[i];
    const gcpRow = gcpChecks[i];
    const timestamp = awsRow?.checked_at || gcpRow?.checked_at || new Date().toISOString();
    latencySeries.push({
      time: new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      timestamp,
      awsLatencyMs: awsRow ? Number(awsRow.response_time_ms) : null,
      gcpLatencyMs: gcpRow ? Number(gcpRow.response_time_ms) : null,
      awsHealthy: awsRow ? (awsRow.status === 'UNHEALTHY' ? 0 : 100) : null,
      gcpHealthy: gcpRow ? (gcpRow.status === 'UNHEALTHY' ? 0 : 100) : null,
    });
  }

  return {
    overallAvailabilityPercent: overallAvailability,
    aws: {
      avgResponseTimeMs: avgLatency(awsChecks),
      uptimePercent: healthyRatio(awsChecks),
      sampleCount: awsChecks.length,
    },
    gcp: {
      avgResponseTimeMs: avgLatency(gcpChecks),
      uptimePercent: healthyRatio(gcpChecks),
      sampleCount: gcpChecks.length,
    },
    rtoTargetSeconds: drState.rtoTargetSeconds,
    rpoTargetSeconds: drState.rpoTargetSeconds,
    lastRtoSeconds: drState.failover.lastRtoSeconds,
    lastRpoSeconds: drState.failover.lastRpoSeconds,
    failoverCount: failoverHistory.filter((f) => f.event_type === 'FAILOVER').length,
    latencySeries,
  };
}
