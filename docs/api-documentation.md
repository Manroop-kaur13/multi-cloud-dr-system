# REST API Documentation

Base URL: `http://localhost:5000/api`

## Health & Active Cloud

### `GET /api/health`
Load-balancer compatible health check.
- Query params: `?target=aws` or `?target=gcp` (optional, checks a specific cloud node and returns `503` if that node is `UNHEALTHY`).
- Response (`200 OK`):
```json
{
  "status": "UP",
  "activeCloud": "AWS",
  "region": "us-east-1",
  "failoverStatus": "NORMAL",
  "databaseConnected": true,
  "databaseMode": "postgres",
  "timestamp": "2026-11-26T02:20:00.000Z"
}
```

### `GET /api/active-cloud`
Returns the cloud currently serving application traffic (`AWS` or `GCP`).

## Status & Telemetry

### `GET /api/status`
Returns overall availability, AWS/GCP node objects, active failover pipeline steps, database connection status, and recent events.

### `GET /api/metrics?limit=30`
Returns latency series (`awsLatencyMs`, `gcpLatencyMs`), average response times, uptime percentages, and RTO/RPO targets.

## Failover & Recovery

### `POST /api/failover/simulate`
Body:
```json
{
  "action": "outage"
}
```
Supported `action` values:
- `outage`: Marks AWS `DOWN` and runs a health check round (triggers auto-failover once `FAILURE_THRESHOLD` is met).
- `degrade`: Marks AWS `DEGRADED` with elevated latency.
- `immediate_failover`: Injects AWS outage and immediately executes failover to GCP.
- `restore_aws`: Clears simulated AWS outage flags.

### `POST /api/recovery`
Restores AWS Primary health, synchronizes replication, switches DNS routing back to AWS, and returns GCP to warm standby.

## Database & Replication

### `GET /api/replication`
Returns database connection details, `replication` status (`lagMs`, `estimatedRpoSeconds`, `lastSyncAt`), `objectStorage` sync info, and `recentRecords`.

### `POST /api/replication/records`
Inserts a sample record (`{ "recordKey": "TXN-2001", "payload": "{\"order\":99}" }`) to demonstrate live data replication.

### `POST /api/replication/sync`
Runs a synchronization cycle across pending WAL records.

## Events & Monitoring

### `GET /api/events?type=ALL&severity=ALL&limit=50`
Returns filtered `events` and `failoverHistory`.

### `POST /api/monitoring/check`
Triggers an immediate health check round for both AWS and GCP.

### `POST /api/monitoring/auto-failover`
Body: `{ "enabled": true }` — toggles automatic failover detection.
