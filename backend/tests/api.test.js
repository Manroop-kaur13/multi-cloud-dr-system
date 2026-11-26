import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

process.env.NODE_ENV = 'test';
process.env.DB_MODE = 'memory';
process.env.FAILURE_THRESHOLD = '2';

const { createApp } = await import('../src/app.js');
const { closeDatabaseClient } = await import('../src/database/dbClient.js');
const { runMigrationsAndSeed } = await import('../src/database/migrator.js');
const { runHealthCheckCycle } = await import('../src/services/healthMonitorService.js');

let server;
let baseUrl;

describe('Multi-Cloud DR & Automated Failover API', () => {
  before(async () => {
    await runMigrationsAndSeed();
    await runHealthCheckCycle();
    const app = createApp();
    await new Promise((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        baseUrl = `http://127.0.0.1:${addr.port}/api`;
        resolve();
      });
    });
  });

  after(async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabaseClient();
  });

  it('serves initial health and active cloud on AWS', async () => {
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.equal(healthRes.status, 200);
    const healthBody = await healthRes.json();
    assert.equal(healthBody.status, 'UP');
    assert.equal(healthBody.activeCloud, 'AWS');
    assert.equal(healthBody.databaseConnected, true);

    const activeRes = await fetch(`${baseUrl}/active-cloud`);
    assert.equal(activeRes.status, 200);
    const activeBody = await activeRes.json();
    assert.equal(activeBody.activeCloud, 'AWS');
    assert.equal(activeBody.mode, 'PRIMARY_ACTIVE');
  });

  it('returns system status, metrics, and replication overview', async () => {
    const [statusRes, metricsRes, repRes] = await Promise.all([
      fetch(`${baseUrl}/status`),
      fetch(`${baseUrl}/metrics`),
      fetch(`${baseUrl}/replication`),
    ]);

    assert.equal(statusRes.status, 200);
    assert.equal(metricsRes.status, 200);
    assert.equal(repRes.status, 200);

    const status = await statusRes.json();
    const metrics = await metricsRes.json();
    const rep = await repRes.json();

    assert.equal(status.activeCloud, 'AWS');
    assert.ok(metrics.overallAvailabilityPercent >= 0);
    assert.ok(Array.isArray(metrics.latencySeries));
    assert.ok(rep.totalRecords >= 4);
  });

  it('writes sample replicated record and syncs replication', async () => {
    const createRes = await fetch(`${baseUrl}/replication/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        recordKey: 'TXN-TEST-9001',
        payload: '{"service":"test-suite","ok":true}',
      }),
    });
    assert.equal(createRes.status, 201);
    const created = await createRes.json();
    assert.equal(created.record.record_key, 'TXN-TEST-9001');

    const syncRes = await fetch(`${baseUrl}/replication/sync`, { method: 'POST' });
    assert.equal(syncRes.status, 200);
    const synced = await syncRes.json();
    assert.equal(synced.replication.pendingWalRecords, 0);
  });

  it('automatically fails over to GCP after consecutive AWS health failures and recovers to AWS', async () => {
    // Inject AWS outage (1st failed probe)
    const simRes = await fetch(`${baseUrl}/failover/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'outage', stepDelayMs: 10 }),
    });
    assert.equal(simRes.status, 200);

    // 2nd failed probe reaches FAILURE_THRESHOLD=2 and triggers auto-failover
    const checkRes = await fetch(`${baseUrl}/monitoring/check`, { method: 'POST' });
    assert.equal(checkRes.status, 200);
    const checkBody = await checkRes.json();
    assert.equal(checkBody.activeCloud, 'GCP');
    assert.equal(checkBody.failover.status, 'FAILED_OVER');

    // AWS target probe returns 503 while global /api/health stays 200 via GCP
    const awsTargetRes = await fetch(`${baseUrl}/health?target=aws`);
    assert.equal(awsTargetRes.status, 503);
    const globalHealthRes = await fetch(`${baseUrl}/health`);
    assert.equal(globalHealthRes.status, 200);
    const globalHealth = await globalHealthRes.json();
    assert.equal(globalHealth.activeCloud, 'GCP');

    // Recover back to AWS primary
    const recRes = await fetch(`${baseUrl}/recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepDelayMs: 10 }),
    });
    assert.equal(recRes.status, 200);
    const recBody = await recRes.json();
    assert.equal(recBody.activeCloud, 'AWS');
    assert.equal(recBody.failover.status, 'NORMAL');

    const awsAfterRecovery = await fetch(`${baseUrl}/health?target=aws`);
    assert.equal(awsAfterRecovery.status, 200);

    // Verify events were logged
    const eventsRes = await fetch(`${baseUrl}/events?limit=30`);
    assert.equal(eventsRes.status, 200);
    const eventsBody = await eventsRes.json();
    const types = new Set(eventsBody.events.map((e) => e.event_type));
    assert.ok(types.has('OUTAGE_SIMULATED'));
    assert.ok(types.has('FAILOVER'));
    assert.ok(types.has('RECOVERY'));
  });
});
