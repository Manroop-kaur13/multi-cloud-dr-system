import { switchDnsTraffic } from '../cloud/dnsFailover.js';
import {
  completeFailoverEvent,
  createFailoverEvent,
  getFailoverHistory,
} from '../database/repositories/failoverRepo.js';
import { drState } from './drState.js';
import { logSystemEvent } from './eventLoggerService.js';
import { registerAutoFailoverHandler, runHealthCheckCycle } from './healthMonitorService.js';
import { syncReplicationState } from './replicationService.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const FAILOVER_STEP_TEMPLATES = [
  { id: 'detect', label: 'Detect Primary Cloud Failure (AWS us-east-1)' },
  { id: 'verify_standby', label: 'Verify Warm Standby Readiness (GCP us-central1)' },
  { id: 'dns_cutover', label: 'Switch Simulated DNS / Load Balancer Routing' },
  { id: 'promote_db', label: 'Promote GCP PostgreSQL Standby to Active' },
  { id: 'verify_traffic', label: 'Confirm Active Traffic Serving on GCP' },
];

const RECOVERY_STEP_TEMPLATES = [
  { id: 'verify_aws', label: 'Verify AWS Primary Health & Endpoints' },
  { id: 'wal_resync', label: 'Catch Up PostgreSQL Cross-Cloud Replication' },
  { id: 'storage_sync', label: 'Synchronize Object Storage Artifacts' },
  { id: 'dns_restore', label: 'Restore DNS Routing Back to AWS Primary' },
  { id: 'standby_reset', label: 'Return GCP Node to Warm Standby Mode' },
];

function buildSteps(templates, completedCount, inProgressIndex = -1) {
  return templates.map((tpl, idx) => ({
    id: tpl.id,
    label: tpl.label,
    status:
      idx < completedCount
        ? 'COMPLETED'
        : idx === inProgressIndex
          ? 'IN_PROGRESS'
          : 'PENDING',
  }));
}

export async function executeFailover({
  reason = 'Simulated AWS primary outage triggered failover.',
  stepDelayMs = 250,
} = {}) {
  if (drState.failover.inProgress) {
    return { alreadyInProgress: true, failover: drState.failover };
  }

  if (drState.activeCloud === 'GCP') {
    return { alreadyFailedOver: true, failover: drState.failover };
  }

  const startedMs = Date.now();
  drState.failover.inProgress = true;
  drState.failover.status = 'IN_PROGRESS';
  drState.failover.progressPercent = 10;
  drState.failover.currentAction = 'Initiating automated failover from AWS to GCP...';
  drState.failover.steps = buildSteps(FAILOVER_STEP_TEMPLATES, 0, 0);

  const failoverRecord = await createFailoverEvent({
    eventType: 'FAILOVER',
    fromCloud: 'AWS',
    toCloud: 'GCP',
    triggerReason: reason,
    status: 'IN_PROGRESS',
    rpoEstimatedSeconds: drState.failover.lastRpoSeconds ?? 0.25,
  });

  await logSystemEvent({
    eventType: 'FAILOVER',
    severity: 'WARNING',
    source: 'FAILOVER_ENGINE',
    message: `Failover initiated: AWS -> GCP. Reason: ${reason}`,
    metadata: { failoverId: failoverRecord.id, fromCloud: 'AWS', toCloud: 'GCP' },
  });

  try {
    for (let i = 0; i < FAILOVER_STEP_TEMPLATES.length; i += 1) {
      drState.failover.steps = buildSteps(FAILOVER_STEP_TEMPLATES, i, i);
      drState.failover.currentAction = FAILOVER_STEP_TEMPLATES[i].label;
      drState.failover.progressPercent = Math.round(((i + 0.5) / FAILOVER_STEP_TEMPLATES.length) * 100);

      if (FAILOVER_STEP_TEMPLATES[i].id === 'dns_cutover') {
        await switchDnsTraffic({ fromCloud: 'AWS', toCloud: 'GCP' });
      }

      if (FAILOVER_STEP_TEMPLATES[i].id === 'promote_db') {
        drState.activeCloud = 'GCP';
        drState.clouds.AWS.role = 'OFFLINE_PRIMARY';
        drState.clouds.GCP.role = 'ACTIVE_PRIMARY';
        await syncReplicationState({ logEvent: false });
      }

      if (stepDelayMs > 0) {
        await sleep(stepDelayMs);
      }
    }

    const rtoAchieved = Number(((Date.now() - startedMs) / 1000).toFixed(2));
    const rpoEstimated = Number(drState.failover.lastRpoSeconds ?? 0.25);

    drState.activeCloud = 'GCP';
    drState.failover.inProgress = false;
    drState.failover.status = 'FAILED_OVER';
    drState.failover.progressPercent = 100;
    drState.failover.currentAction = 'Traffic successfully failed over to GCP (us-central1)';
    drState.failover.lastFailoverAt = new Date().toISOString();
    drState.failover.lastRtoSeconds = rtoAchieved;
    drState.failover.steps = buildSteps(FAILOVER_STEP_TEMPLATES, FAILOVER_STEP_TEMPLATES.length);

    const completedRecord = await completeFailoverEvent(failoverRecord.id, {
      status: 'COMPLETED',
      rtoAchievedSeconds: rtoAchieved,
      rpoEstimatedSeconds: rpoEstimated,
    });

    await logSystemEvent({
      eventType: 'FAILOVER',
      severity: 'SUCCESS',
      source: 'FAILOVER_ENGINE',
      message: `Automated failover completed in ${rtoAchieved}s (RTO target: ${drState.rtoTargetSeconds}s). Active traffic is now served by GCP us-central1.`,
      metadata: {
        failoverId: failoverRecord.id,
        rtoAchievedSeconds: rtoAchieved,
        rpoEstimatedSeconds: rpoEstimated,
        activeCloud: 'GCP',
      },
    });

    return {
      completed: true,
      activeCloud: drState.activeCloud,
      failoverEvent: completedRecord,
      failover: drState.failover,
    };
  } catch (err) {
    drState.failover.inProgress = false;
    drState.failover.status = 'FAILED';
    await completeFailoverEvent(failoverRecord.id, {
      status: 'FAILED',
      rtoAchievedSeconds: null,
      rpoEstimatedSeconds: drState.failover.lastRpoSeconds ?? 0,
    });
    throw err;
  }
}

export async function executeRecovery({
  reason = 'Operator initiated primary cloud restoration (failback to AWS).',
  stepDelayMs = 250,
} = {}) {
  if (drState.failover.inProgress) {
    return { alreadyInProgress: true, failover: drState.failover };
  }

  const startedMs = Date.now();
  drState.failover.inProgress = true;
  drState.failover.status = 'RECOVERING';
  drState.failover.progressPercent = 10;
  drState.failover.currentAction = 'Restoring AWS Primary health and initiating failback...';
  drState.failover.steps = buildSteps(RECOVERY_STEP_TEMPLATES, 0, 0);

  // Restore AWS primary simulation state before probing
  drState.clouds.AWS.simulation.outageMode = 'HEALTHY';
  drState.clouds.AWS.simulation.simulatedLatencyMs = 0;
  drState.clouds.AWS.consecutiveFailures = 0;

  const fromCloud = drState.activeCloud;
  const recoveryRecord = await createFailoverEvent({
    eventType: 'RECOVERY',
    fromCloud,
    toCloud: 'AWS',
    triggerReason: reason,
    status: 'IN_PROGRESS',
    rpoEstimatedSeconds: 0,
  });

  await logSystemEvent({
    eventType: 'RECOVERY',
    severity: 'INFO',
    source: 'ADMIN_ACTION',
    message: `Primary restoration initiated: returning active workload from ${fromCloud} to AWS us-east-1.`,
    metadata: { recoveryId: recoveryRecord.id, fromCloud, toCloud: 'AWS' },
  });

  try {
    for (let i = 0; i < RECOVERY_STEP_TEMPLATES.length; i += 1) {
      drState.failover.steps = buildSteps(RECOVERY_STEP_TEMPLATES, i, i);
      drState.failover.currentAction = RECOVERY_STEP_TEMPLATES[i].label;
      drState.failover.progressPercent = Math.round(((i + 0.5) / RECOVERY_STEP_TEMPLATES.length) * 100);

      if (RECOVERY_STEP_TEMPLATES[i].id === 'verify_aws') {
        await runHealthCheckCycle();
      }
      if (RECOVERY_STEP_TEMPLATES[i].id === 'wal_resync') {
        await syncReplicationState({ logEvent: true });
      }
      if (RECOVERY_STEP_TEMPLATES[i].id === 'dns_restore') {
        await switchDnsTraffic({ fromCloud, toCloud: 'AWS' });
        drState.activeCloud = 'AWS';
        drState.clouds.AWS.role = 'PRIMARY';
        drState.clouds.GCP.role = 'WARM_STANDBY';
      }

      if (stepDelayMs > 0) {
        await sleep(stepDelayMs);
      }
    }

    const rtoAchieved = Number(((Date.now() - startedMs) / 1000).toFixed(2));
    drState.activeCloud = 'AWS';
    drState.failover.inProgress = false;
    drState.failover.status = 'NORMAL';
    drState.failover.progressPercent = 100;
    drState.failover.currentAction = 'Primary cloud AWS (us-east-1) restored and serving traffic';
    drState.failover.lastRecoveryAt = new Date().toISOString();
    drState.failover.steps = buildSteps(RECOVERY_STEP_TEMPLATES, RECOVERY_STEP_TEMPLATES.length);

    await syncReplicationState({ logEvent: false });

    const completedRecord = await completeFailoverEvent(recoveryRecord.id, {
      status: 'COMPLETED',
      rtoAchievedSeconds: rtoAchieved,
      rpoEstimatedSeconds: 0,
    });

    await logSystemEvent({
      eventType: 'RECOVERY',
      severity: 'SUCCESS',
      source: 'FAILOVER_ENGINE',
      message: `Primary cloud restored to AWS us-east-1 in ${rtoAchieved}s. GCP returned to warm standby.`,
      metadata: { recoveryId: recoveryRecord.id, rtoAchievedSeconds: rtoAchieved, activeCloud: 'AWS' },
    });

    return {
      recovered: true,
      activeCloud: drState.activeCloud,
      failoverEvent: completedRecord,
      failover: drState.failover,
    };
  } catch (err) {
    drState.failover.inProgress = false;
    drState.failover.status = 'FAILED';
    throw err;
  }
}

export async function simulateOutageAction({
  action = 'outage',
  latencyMs = 3200,
  stepDelayMs = 250,
} = {}) {
  if (action === 'restore_aws') {
    drState.clouds.AWS.simulation.outageMode = 'HEALTHY';
    drState.clouds.AWS.simulation.simulatedLatencyMs = 0;
    drState.clouds.AWS.consecutiveFailures = 0;
    await logSystemEvent({
      eventType: 'HEALTH_CHECK_RECOVERY',
      severity: 'INFO',
      source: 'ADMIN_ACTION',
      message: 'Simulated AWS primary outage cleared manually. Next probe will verify health.',
    });
    const probe = await runHealthCheckCycle();
    return { action, probe, activeCloud: drState.activeCloud, failover: drState.failover };
  }

  if (action === 'degrade') {
    drState.clouds.AWS.simulation.outageMode = 'DEGRADED';
    drState.clouds.AWS.simulation.simulatedLatencyMs = Number(latencyMs) || 1450;
    await logSystemEvent({
      eventType: 'OUTAGE_SIMULATED',
      severity: 'WARNING',
      source: 'ADMIN_ACTION',
      message: `Simulated AWS primary latency degradation (${drState.clouds.AWS.simulation.simulatedLatencyMs} ms).`,
    });
    const probe = await runHealthCheckCycle();
    return { action, probe, activeCloud: drState.activeCloud, failover: drState.failover };
  }

  if (action === 'immediate_failover') {
    drState.clouds.AWS.simulation.outageMode = 'DOWN';
    drState.clouds.AWS.simulation.simulatedLatencyMs = 3200;
    await logSystemEvent({
      eventType: 'OUTAGE_SIMULATED',
      severity: 'CRITICAL',
      source: 'ADMIN_ACTION',
      message: 'Simulated AWS us-east-1 outage with immediate failover execution.',
    });
    await runHealthCheckCycle();
    const failoverResult = await executeFailover({
      reason: 'Simulated AWS primary outage (immediate failover requested).',
      stepDelayMs,
    });
    return { action, ...failoverResult };
  }

  // Default: 'outage' — marks AWS DOWN and runs health probe; auto-failover triggers on threshold
  drState.clouds.AWS.simulation.outageMode = 'DOWN';
  drState.clouds.AWS.simulation.simulatedLatencyMs = 3200;
  await logSystemEvent({
    eventType: 'OUTAGE_SIMULATED',
    severity: 'CRITICAL',
    source: 'ADMIN_ACTION',
    message: `Simulated AWS us-east-1 outage injected. Health monitor requires ${drState.failureThreshold} consecutive failures to trigger auto-failover.`,
  });
  const probe = await runHealthCheckCycle();
  return { action: 'outage', probe, activeCloud: drState.activeCloud, failover: drState.failover };
}

export async function getFailoverTimeline(limit = 20) {
  return getFailoverHistory(limit);
}

registerAutoFailoverHandler(executeFailover);
