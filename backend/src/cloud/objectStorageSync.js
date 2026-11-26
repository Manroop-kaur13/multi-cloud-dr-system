import { env } from '../config/env.js';

/**
 * Cloud Object-Storage Synchronization Module (Placeholder + Local Simulation Adapter)
 *
 * Future Object Storage Integration:
 * - AWS S3 Event Notifications / S3 Batch Replication -> Google Cloud Storage Transfer Service
 *   for static assets, backups, and WAL archive snapshots.
 */
let lastObjectSync = {
  mode: 'LOCAL_SIMULATION',
  sourceBucket: `s3://multicloud-dr-assets-${env.clouds.aws.region}`,
  targetBucket: `gs://multicloud-dr-standby-${env.clouds.gcp.region}`,
  objectsSynced: 128,
  syncStatus: 'SYNCED',
  lastSyncAt: new Date().toISOString(),
};

export async function triggerObjectStorageSync(activeCloud) {
  lastObjectSync = {
    ...lastObjectSync,
    mode: env.simulationMode ? 'LOCAL_SIMULATION' : 'CLOUD_TRANSFER_SERVICE',
    syncStatus: 'SYNCED',
    activeOrigin: activeCloud,
    objectsSynced: lastObjectSync.objectsSynced + 1,
    lastSyncAt: new Date().toISOString(),
  };
  return { ...lastObjectSync };
}

export function getObjectStorageSyncStatus() {
  return { ...lastObjectSync };
}
