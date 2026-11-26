-- Multi-Cloud Disaster Recovery & Automated Failover System
-- PostgreSQL Database Schema

CREATE TABLE IF NOT EXISTS health_checks (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(20) NOT NULL,
  region VARCHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  http_status INTEGER NOT NULL,
  error_message TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS failover_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(30) NOT NULL,
  from_cloud VARCHAR(20) NOT NULL,
  to_cloud VARCHAR(20) NOT NULL,
  trigger_reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL,
  rto_achieved_seconds NUMERIC(8, 2),
  rpo_estimated_seconds NUMERIC(8, 2),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS system_events (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(40) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  source VARCHAR(40) NOT NULL,
  message TEXT NOT NULL,
  metadata_json TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replication_status (
  id SERIAL PRIMARY KEY,
  primary_db_status VARCHAR(20) NOT NULL,
  secondary_db_status VARCHAR(20) NOT NULL,
  replication_mode VARCHAR(30) NOT NULL,
  lag_ms INTEGER NOT NULL,
  estimated_rpo_seconds NUMERIC(8, 2) NOT NULL,
  records_synced INTEGER NOT NULL,
  pending_wal_records INTEGER NOT NULL DEFAULT 0,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replicated_records (
  id SERIAL PRIMARY KEY,
  record_key VARCHAR(64) NOT NULL,
  payload TEXT NOT NULL,
  source_cloud VARCHAR(20) NOT NULL,
  primary_synced BOOLEAN NOT NULL DEFAULT TRUE,
  secondary_synced BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  replicated_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_health_checks_provider_time ON health_checks (provider, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_events_type_time ON system_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failover_events_time ON failover_events (started_at DESC);
