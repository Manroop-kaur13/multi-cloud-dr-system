# System Architecture

## 1. Three-Tier Design

- **Tier 1 — Presentation (React + Vite + Nginx):**
  Single-page monitoring console consuming REST APIs via `frontend/src/services/api.js` and polling live state via `usePolling`.
- **Tier 2 — Application & DR Control Plane (Node.js + Express):**
  Stateless HTTP controllers backed by modular services:
  - `healthMonitorService`: Periodic probe loop tracking consecutive failures against `FAILURE_THRESHOLD`.
  - `failoverService`: State machine executing 5-step Failover (`AWS -> GCP`) and 5-step Recovery (`GCP -> AWS`) with RTO measurement.
  - `replicationService`: Manages simulated WAL lag, RPO estimation, and `replicated_records` synchronization.
  - `eventLoggerService`: Persists structured events into PostgreSQL.
- **Tier 3 — Data Persistence (PostgreSQL):**
  Relational schema defined in `database/schema.sql` with 5 tables: `health_checks`, `failover_events`, `system_events`, `replication_status`, and `replicated_records`.

## 2. Cloud-Independent Adapter Layer (`backend/src/cloud/`)

All cloud-specific behavior is isolated behind dedicated adapter modules so the core DR engine does not depend on cloud SDKs directly:

- `awsHealthCheck.js` — AWS Route 53 / ALB probe adapter
- `gcpHealthCheck.js` — GCP Cloud Monitoring uptime check adapter
- `dnsFailover.js` — DNS weighted/failover record switching adapter
- `cloudDbReplication.js` — Cross-cloud PostgreSQL replication & standby promotion adapter
- `objectStorageSync.js` — S3 to GCS synchronization adapter
