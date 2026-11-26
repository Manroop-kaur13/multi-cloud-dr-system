import { env } from '../config/env.js';

export const drState = {
  activeCloud: 'AWS', // 'AWS' | 'GCP'
  autoFailoverEnabled: env.monitoring.autoFailoverEnabled,
  failureThreshold: env.monitoring.failureThreshold,
  checkIntervalMs: env.monitoring.intervalMs,
  rtoTargetSeconds: env.monitoring.rtoTargetSeconds,
  rpoTargetSeconds: env.monitoring.rpoTargetSeconds,
  lastCheckAt: null,
  clouds: {
    AWS: {
      provider: 'AWS',
      role: 'PRIMARY',
      region: env.clouds.aws.region,
      endpoint: env.clouds.aws.endpoint,
      status: 'HEALTHY',
      httpStatus: 200,
      responseTimeMs: 42,
      consecutiveFailures: 0,
      lastSuccessfulCheckAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      errorMessage: null,
      simulation: {
        outageMode: 'HEALTHY', // 'HEALTHY' | 'DEGRADED' | 'DOWN'
        simulatedLatencyMs: 0,
      },
    },
    GCP: {
      provider: 'GCP',
      role: 'WARM_STANDBY',
      region: env.clouds.gcp.region,
      endpoint: env.clouds.gcp.endpoint,
      status: 'HEALTHY',
      httpStatus: 200,
      responseTimeMs: 58,
      consecutiveFailures: 0,
      lastSuccessfulCheckAt: new Date().toISOString(),
      lastCheckedAt: new Date().toISOString(),
      errorMessage: null,
      simulation: {
        outageMode: 'HEALTHY', // 'HEALTHY' | 'DOWN'
        simulatedLatencyMs: 0,
      },
    },
  },
  failover: {
    status: 'NORMAL', // 'NORMAL' | 'IN_PROGRESS' | 'FAILED_OVER' | 'RECOVERING'
    inProgress: false,
    progressPercent: 0,
    currentAction: 'Serving normally from AWS Primary (us-east-1)',
    lastFailoverAt: null,
    lastRecoveryAt: null,
    lastRtoSeconds: null,
    lastRpoSeconds: 0.25,
    steps: [],
  },
};
