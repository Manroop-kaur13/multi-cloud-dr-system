import { env } from '../config/env.js';

/**
 * Cloud Database Replication Integration Module (Placeholder + Local Simulation Adapter)
 *
 * Future Cloud DB Integration:
 * - AWS RDS PostgreSQL -> Cross-Cloud Logical Replication / Debezium / GCP Cloud SQL
 *   External Server replica promotion (`gcloud sql instances promote-replica`).
 * - In local simulation mode, tracks WAL lag, RPO estimates, and `replicated_records` sync state.
 */
export async function syncCrossCloudDatabase({ activeCloud, awsHealthy, gcpHealthy }) {
  const configured = !env.simulationMode && env.clouds.aws.hasCredentials && env.clouds.gcp.hasCredentials;

  if (!awsHealthy && activeCloud === 'GCP') {
    return {
      mode: configured ? 'CLOUD_SQL_PROMOTED' : 'LOCAL_SIMULATION',
      primaryDbStatus: 'OFFLINE',
      secondaryDbStatus: 'PROMOTED',
      replicationMode: 'PROMOTED_PRIMARY_SIM',
      lagMs: 0,
      estimatedRpoSeconds: 0.4,
      note: 'GCP PostgreSQL standby promoted to read/write while AWS primary is unreachable.',
    };
  }

  const simulatedLagMs = Math.floor(Math.random() * 140) + 110;
  return {
    mode: configured ? 'CROSS_CLOUD_LOGICAL_REPLICATION' : 'LOCAL_SIMULATION',
    primaryDbStatus: awsHealthy ? 'ONLINE' : 'OFFLINE',
    secondaryDbStatus: gcpHealthy ? 'STANDBY_SYNCED' : 'OFFLINE',
    replicationMode: 'ASYNC_STREAMING_SIM',
    lagMs: simulatedLagMs,
    estimatedRpoSeconds: Number((simulatedLagMs / 1000).toFixed(2)),
    note: 'Simulated asynchronous WAL streaming from AWS RDS Primary to GCP Cloud SQL Standby.',
  };
}
