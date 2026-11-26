-- Multi-Cloud Disaster Recovery & Automated Failover System
-- Initial Seed Data

INSERT INTO health_checks (provider, region, status, response_time_ms, http_status, error_message, checked_at)
VALUES
  ('AWS', 'us-east-1', 'HEALTHY', 42, 200, NULL, NOW() - INTERVAL '180 seconds'),
  ('GCP', 'us-central1', 'HEALTHY', 58, 200, NULL, NOW() - INTERVAL '180 seconds'),
  ('AWS', 'us-east-1', 'HEALTHY', 39, 200, NULL, NOW() - INTERVAL '120 seconds'),
  ('GCP', 'us-central1', 'HEALTHY', 55, 200, NULL, NOW() - INTERVAL '120 seconds'),
  ('AWS', 'us-east-1', 'HEALTHY', 44, 200, NULL, NOW() - INTERVAL '60 seconds'),
  ('GCP', 'us-central1', 'HEALTHY', 61, 200, NULL, NOW() - INTERVAL '60 seconds');

INSERT INTO replication_status (
  primary_db_status,
  secondary_db_status,
  replication_mode,
  lag_ms,
  estimated_rpo_seconds,
  records_synced,
  pending_wal_records,
  last_sync_at
)
VALUES (
  'ONLINE',
  'STANDBY_SYNCED',
  'ASYNC_STREAMING_SIM',
  185,
  0.25,
  4,
  0,
  NOW()
);

INSERT INTO replicated_records (record_key, payload, source_cloud, primary_synced, secondary_synced, created_at, replicated_at)
VALUES
  ('TXN-1001', '{"service":"orders-api","amount":129.50,"region":"us-east-1"}', 'AWS', TRUE, TRUE, NOW() - INTERVAL '240 seconds', NOW() - INTERVAL '239 seconds'),
  ('TXN-1002', '{"service":"auth-session","user":"student-01","status":"active"}', 'AWS', TRUE, TRUE, NOW() - INTERVAL '180 seconds', NOW() - INTERVAL '179 seconds'),
  ('TXN-1003', '{"service":"billing-ledger","currency":"USD","verified":true}', 'AWS', TRUE, TRUE, NOW() - INTERVAL '90 seconds', NOW() - INTERVAL '89 seconds'),
  ('TXN-1004', '{"service":"inventory-sync","sku":"NODE-HA-04","qty":42}', 'AWS', TRUE, TRUE, NOW() - INTERVAL '30 seconds', NOW() - INTERVAL '29 seconds');

INSERT INTO system_events (event_type, severity, source, message, metadata_json, created_at)
VALUES
  ('SYSTEM_INFO', 'INFO', 'FAILOVER_ENGINE', 'Multi-cloud DR controller initialized with AWS us-east-1 as active primary and GCP us-central1 as warm standby.', '{"activeCloud":"AWS","standbyCloud":"GCP","simulationMode":true}', NOW() - INTERVAL '180 seconds'),
  ('REPLICATION_SYNC', 'SUCCESS', 'REPLICATION_SERVICE', 'Initial PostgreSQL cross-cloud replication baseline synchronized (lag: 185 ms).', '{"lagMs":185,"recordsSynced":4}', NOW() - INTERVAL '60 seconds');
