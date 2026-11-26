import { drState } from '../services/drState.js';
import { logSystemEvent } from '../services/eventLoggerService.js';
import {
  executeRecovery,
  simulateOutageAction,
} from '../services/failoverService.js';
import { runHealthCheckCycle } from '../services/healthMonitorService.js';

export async function simulateFailover(req, res, next) {
  try {
    const { action = 'outage', latencyMs, stepDelayMs } = req.body || {};
    const result = await simulateOutageAction({
      action,
      latencyMs,
      stepDelayMs: typeof stepDelayMs === 'number' ? stepDelayMs : 250,
    });
    res.json({
      message: `Simulation action '${action}' executed.`,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function recoverPrimary(req, res, next) {
  try {
    const { reason, stepDelayMs } = req.body || {};
    const result = await executeRecovery({
      reason,
      stepDelayMs: typeof stepDelayMs === 'number' ? stepDelayMs : 250,
    });
    res.json({
      message: 'Primary cloud recovery completed.',
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function triggerManualHealthCheck(_req, res, next) {
  try {
    const result = await runHealthCheckCycle();
    res.json({
      message: 'Manual health check round completed.',
      ...result,
      failover: drState.failover,
    });
  } catch (err) {
    next(err);
  }
}

export async function toggleAutoFailover(req, res, next) {
  try {
    const { enabled } = req.body || {};
    drState.autoFailoverEnabled =
      typeof enabled === 'boolean' ? enabled : !drState.autoFailoverEnabled;

    await logSystemEvent({
      eventType: 'SYSTEM_INFO',
      severity: 'INFO',
      source: 'ADMIN_ACTION',
      message: `Automated failover detection ${drState.autoFailoverEnabled ? 'enabled' : 'disabled'}.`,
      metadata: { autoFailoverEnabled: drState.autoFailoverEnabled },
    });

    res.json({
      autoFailoverEnabled: drState.autoFailoverEnabled,
    });
  } catch (err) {
    next(err);
  }
}
