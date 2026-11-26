import { syncCrossCloudDatabase } from '../cloud/cloudDbReplication.js';
import { getObjectStorageSyncStatus, triggerObjectStorageSync } from '../cloud/objectStorageSync.js';
import { getDbStatus } from '../database/dbClient.js';
import {
  countReplicatedRecords,
  insertReplicatedRecord,
  listReplicatedRecords,
  markAllRecordsReplicatedToBoth,
} from '../database/repositories/appDataRepo.js';
import {
  getLatestReplicationStatus,
  updateReplicationStatus,
} from '../database/repositories/replicationRepo.js';
import { drState } from './drState.js';
import { logSystemEvent } from './eventLoggerService.js';

export async function getReplicationOverview() {
  const [statusRow, records, totalCount] = await Promise.all([
    getLatestReplicationStatus(),
    listReplicatedRecords(15),
    countReplicatedRecords(),
  ]);

  const dbStatus = getDbStatus();
  const objectStorage = getObjectStorageSyncStatus();

  return {
    databaseConnection: dbStatus,
    replication: statusRow
      ? {
          primaryDbStatus: statusRow.primary_db_status,
          secondaryDbStatus: statusRow.secondary_db_status,
          replicationMode: statusRow.replication_mode,
          lagMs: Number(statusRow.lag_ms),
          estimatedRpoSeconds: Number(statusRow.estimated_rpo_seconds),
          recordsSynced: Number(statusRow.records_synced),
          pendingWalRecords: Number(statusRow.pending_wal_records),
          lastSyncAt: statusRow.last_sync_at,
        }
      : {
          primaryDbStatus: 'ONLINE',
          secondaryDbStatus: 'STANDBY_SYNCED',
          replicationMode: 'ASYNC_STREAMING_SIM',
          lagMs: 160,
          estimatedRpoSeconds: 0.16,
          recordsSynced: totalCount,
          pendingWalRecords: 0,
          lastSyncAt: new Date().toISOString(),
        },
    objectStorage,
    totalRecords: totalCount,
    recentRecords: records,
  };
}

export async function syncReplicationState({ logEvent = false } = {}) {
  const awsHealthy = drState.clouds.AWS.status !== 'UNHEALTHY';
  const gcpHealthy = drState.clouds.GCP.status !== 'UNHEALTHY';

  const cloudSync = await syncCrossCloudDatabase({
    activeCloud: drState.activeCloud,
    awsHealthy,
    gcpHealthy,
  });

  let pendingCount = 0;
  if (awsHealthy && gcpHealthy) {
    await markAllRecordsReplicatedToBoth();
  } else {
    const records = await listReplicatedRecords(50);
    pendingCount = records.filter((r) => !r.primary_synced || !r.secondary_synced).length;
  }

  const totalRecords = await countReplicatedRecords();
  const syncedRecords = Math.max(0, totalRecords - pendingCount);

  const updated = await updateReplicationStatus({
    primaryDbStatus: cloudSync.primaryDbStatus,
    secondaryDbStatus: cloudSync.secondaryDbStatus,
    replicationMode: cloudSync.replicationMode,
    lagMs: cloudSync.lagMs,
    estimatedRpoSeconds: cloudSync.estimatedRpoSeconds,
    recordsSynced: syncedRecords,
    pendingWalRecords: pendingCount,
  });

  drState.failover.lastRpoSeconds = Number(cloudSync.estimatedRpoSeconds);
  await triggerObjectStorageSync(drState.activeCloud);

  if (logEvent) {
    await logSystemEvent({
      eventType: 'REPLICATION_SYNC',
      severity: pendingCount > 0 ? 'WARNING' : 'SUCCESS',
      source: 'REPLICATION_SERVICE',
      message: `Replication cycle completed (${cloudSync.replicationMode}, lag: ${cloudSync.lagMs} ms, pending WAL: ${pendingCount}).`,
      metadata: {
        lagMs: cloudSync.lagMs,
        estimatedRpoSeconds: cloudSync.estimatedRpoSeconds,
        pendingWalRecords: pendingCount,
      },
    });
  }

  return updated;
}

export async function createReplicatedSampleRecord({ recordKey, payload }) {
  const activeCloud = drState.activeCloud;
  const awsHealthy = drState.clouds.AWS.status !== 'UNHEALTHY';
  const gcpHealthy = drState.clouds.GCP.status !== 'UNHEALTHY';

  const key =
    recordKey ||
    `TXN-${Math.floor(1000 + Math.random() * 9000)}`;
  const body =
    typeof payload === 'string' && payload.trim().length > 0
      ? payload.trim()
      : JSON.stringify({
          service: 'checkout-service',
          servedBy: activeCloud,
          region: drState.clouds[activeCloud].region,
          timestamp: new Date().toISOString(),
        });

  const primarySynced = awsHealthy || activeCloud === 'AWS';
  const secondarySynced = (awsHealthy && gcpHealthy) || activeCloud === 'GCP';

  const inserted = await insertReplicatedRecord({
    recordKey: key,
    payload: body,
    sourceCloud: activeCloud,
    primarySynced,
    secondarySynced,
  });

  await syncReplicationState({ logEvent: false });

  await logSystemEvent({
    eventType: 'REPLICATION_SYNC',
    severity: 'INFO',
    source: 'REPLICATION_SERVICE',
    message: `Written record ${key} on ${activeCloud} (${primarySynced && secondarySynced ? 'replicated to both clouds' : 'queued in WAL pending primary recovery'}).`,
    metadata: { recordKey: key, sourceCloud: activeCloud, primarySynced, secondarySynced },
  });

  return inserted;
}
