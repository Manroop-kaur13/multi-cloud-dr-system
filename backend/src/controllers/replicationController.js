import {
  createReplicatedSampleRecord,
  getReplicationOverview,
  syncReplicationState,
} from '../services/replicationService.js';

export async function getReplication(_req, res, next) {
  try {
    const overview = await getReplicationOverview();
    res.json(overview);
  } catch (err) {
    next(err);
  }
}

export async function triggerReplicationSync(_req, res, next) {
  try {
    await syncReplicationState({ logEvent: true });
    const overview = await getReplicationOverview();
    res.json({
      message: 'Replication synchronization cycle completed.',
      ...overview,
    });
  } catch (err) {
    next(err);
  }
}

export async function createSampleRecord(req, res, next) {
  try {
    const { recordKey, payload } = req.body || {};
    const record = await createReplicatedSampleRecord({ recordKey, payload });
    const overview = await getReplicationOverview();
    res.status(201).json({
      message: 'Sample record written to active database.',
      record,
      ...overview,
    });
  } catch (err) {
    next(err);
  }
}
