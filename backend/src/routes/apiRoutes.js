import { Router } from 'express';
import { getEvents } from '../controllers/eventsController.js';
import {
  recoverPrimary,
  simulateFailover,
  toggleAutoFailover,
  triggerManualHealthCheck,
} from '../controllers/failoverController.js';
import { getHealth } from '../controllers/healthController.js';
import { getMetrics } from '../controllers/metricsController.js';
import {
  createSampleRecord,
  getReplication,
  triggerReplicationSync,
} from '../controllers/replicationController.js';
import { getActiveCloud, getSystemStatus } from '../controllers/statusController.js';

const router = Router();

router.get('/health', getHealth);
router.get('/status', getSystemStatus);
router.get('/metrics', getMetrics);
router.get('/events', getEvents);
router.get('/active-cloud', getActiveCloud);

router.get('/replication', getReplication);
router.post('/replication/sync', triggerReplicationSync);
router.post('/replication/records', createSampleRecord);

router.post('/failover/simulate', simulateFailover);
router.post('/recovery', recoverPrimary);

router.post('/monitoring/check', triggerManualHealthCheck);
router.post('/monitoring/auto-failover', toggleAutoFailover);

export default router;
