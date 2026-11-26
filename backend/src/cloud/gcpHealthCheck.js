import { env } from '../config/env.js';

/**
 * GCP Health-Check Integration Module (Placeholder + Local Simulation Adapter)
 *
 * Future GCP Integration:
 * - Replace simulated probe with `@google-cloud/monitoring` Uptime Check API
 *   or live HTTP probe to the GCP Cloud Run / GKE Load Balancer `/api/health` endpoint.
 * - Requires GCP_PROJECT_ID, GOOGLE_APPLICATION_CREDENTIALS, GCP_REGION, and GCP_SECONDARY_ENDPOINT.
 */
export async function probeGcpSecondary(simulationState) {
  const startedAt = Date.now();
  const configured = env.clouds.gcp.hasCredentials && !env.simulationMode;

  if (simulationState.outageMode === 'DOWN') {
    return {
      provider: 'GCP',
      region: env.clouds.gcp.region,
      endpoint: env.clouds.gcp.endpoint,
      integrationMode: configured ? 'GCP_CLOUD_MONITORING' : 'LOCAL_SIMULATION',
      status: 'UNHEALTHY',
      httpStatus: 503,
      responseTimeMs: simulationState.simulatedLatencyMs || 2950,
      errorMessage: 'Simulated GCP us-central1 standby outage (503).',
      checkedAt: new Date().toISOString(),
    };
  }

  const jitter = Math.floor(Math.random() * 28) + 44;
  const elapsed = Math.max(jitter, Date.now() - startedAt);

  return {
    provider: 'GCP',
    region: env.clouds.gcp.region,
    endpoint: env.clouds.gcp.endpoint,
    integrationMode: configured ? 'GCP_CLOUD_MONITORING' : 'LOCAL_SIMULATION',
    status: 'HEALTHY',
    httpStatus: 200,
    responseTimeMs: elapsed,
    errorMessage: null,
    checkedAt: new Date().toISOString(),
  };
}
