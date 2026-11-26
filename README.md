# Multi-Cloud Disaster Recovery and Automated Failover System for High-Availability Web Applications

A 3-tier Cloud Computing project demonstrating how a web application maintains high availability during a primary cloud outage by detecting failures automatically and failing over from **AWS (Primary Active)** to **Google Cloud Platform (Warm Standby)**.

> **Important Note on Simulation vs Live Cloud Deployment:**
> Out of the box, this application runs completely locally without AWS or GCP credentials using modular simulation adapters under `backend/src/cloud/`. Instructions for connecting live AWS and GCP infrastructure are documented in [docs/cloud-deployment-guide.md](docs/cloud-deployment-guide.md).

---

## Architecture Overview

1. **Presentation Tier (React + Vite + Tailwind CSS + Recharts)**
   - Provides a real-time Cloud Infrastructure & SRE Monitoring dashboard across 5 pages: Dashboard, Cloud Monitoring, Disaster Recovery, Database & Replication, and Event Logs.
2. **Application Tier (Node.js + Express)**
   - Exposes REST APIs, a load-balancer-ready health endpoint (`GET /api/health`), an automated background health-monitoring loop, a step-by-step failover & recovery orchestrator, replication simulation, and isolated cloud integration modules.
3. **Data Tier (PostgreSQL)**
   - Stores health probe telemetry (`health_checks`), failover/recovery timelines (`failover_events`), audit logs (`system_events`), replication metrics (`replication_status`), and sample application records (`replicated_records`).
   - Supports strict PostgreSQL (`DB_MODE=postgres`) in Docker/cloud environments and automatic local development fallback (`DB_MODE=auto` using `pg-mem`) when a local PostgreSQL server is not running.

---

## Technology Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Recharts, Lucide Icons
- **Backend:** Node.js, Express, Helmet, CORS, Morgan
- **Database:** PostgreSQL 16 (`pg` driver; `pg-mem` local fallback in `auto` mode)
- **Containerization:** Docker, Nginx, Docker Compose

---

## Folder Structure

```text
multi-cloud-dr-system/
  frontend/
    src/
      components/
      pages/
      services/
      hooks/
      styles/
    public/
    package.json
    Dockerfile
    nginx.conf
  backend/
    src/
      cloud/
      config/
      controllers/
      database/
        repositories/
      middleware/
      routes/
      services/
      app.js
      server.js
    tests/
    package.json
    Dockerfile
  database/
    schema.sql
    seed.sql
    init/
      01-schema.sql
      02-seed.sql
  deployment/
    docker-compose.yml
    .env.example
    .dockerignore
  docs/
    architecture.md
    setup.md
    api-documentation.md
    cloud-deployment-guide.md
    testing-guide.md
  README.md
  .gitignore
  .dockerignore
```

---

## Local Installation & Running the Project

### 1. Configure Environment Variables
Copy the example environment file and adjust values if needed:

```bash
cp deployment/.env.example deployment/.env
```

### 2. Run Locally (Without Docker)

**Backend:**
```bash
cd backend
npm install
npm start
```
The backend runs on `http://localhost:5000`. With `DB_MODE=auto`, it connects to PostgreSQL if available or automatically initializes an in-memory PostgreSQL engine (`pg-mem`) seeded with `database/schema.sql` and `database/seed.sql`.

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```
The dashboard opens on `http://localhost:5173` and proxies `/api` requests to `http://localhost:5000`.

### 3. Run with Docker Compose

Ensure `deployment/.env` exists (copied from `deployment/.env.example`) with a password set for `PGPASSWORD`:

```bash
docker compose -f deployment/docker-compose.yml --env-file deployment/.env up --build
```

- Frontend Dashboard: `http://localhost:3000`
- Backend API: `http://localhost:5000/api/health`
- PostgreSQL: `localhost:5432`

---

## API Endpoints Summary

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Load-balancer health check (`?target=aws` or `?target=gcp` supported) |
| `GET` | `/api/status` | Full multi-cloud posture, node states, RTO/RPO, recent events |
| `GET` | `/api/metrics` | Latency time-series, uptime percentages, and availability metrics |
| `GET` | `/api/events` | Filterable audit log (`?type=...&severity=...&limit=...`) |
| `GET` | `/api/replication` | DB connection status, replication lag, RPO, and sample records |
| `POST` | `/api/replication/records` | Insert sample transaction to demonstrate replication |
| `POST` | `/api/replication/sync` | Trigger manual replication synchronization cycle |
| `POST` | `/api/failover/simulate` | Simulate AWS outage (`outage`, `degrade`, `immediate_failover`, `restore_aws`) |
| `POST` | `/api/recovery` | Restore AWS primary health, resync DB, and fail back from GCP |
| `POST` | `/api/monitoring/check` | Execute an immediate health probe cycle |
| `POST` | `/api/monitoring/auto-failover` | Enable or disable automatic failover detection |
| `GET` | `/api/active-cloud` | Lightweight indicator of which cloud is currently serving traffic |

Full payloads and examples are in [docs/api-documentation.md](docs/api-documentation.md).

---

## How to Demonstrate Failover & Recovery

### Simulate an AWS Outage & Automatic Failover
1. Open **Cloud Monitoring** in the sidebar.
2. Verify **Auto-Failover** is `ENABLED` and `Active Cloud` is `AWS`.
3. Click **Simulate AWS Outage** (`POST /api/failover/simulate` with `{"action":"outage"}`).
4. The first failed health probe increments AWS consecutive failures to `1/2`.
5. Wait one probe cycle (5 seconds) or click **Run Health Probe Now** (`POST /api/monitoring/check`).
6. On reaching `2/2` consecutive failures, the failover engine automatically shifts traffic to **GCP (`us-central1`)**, promotes the standby database status, logs timestamps & RTO, and updates the dashboard.

### Trigger Immediate Failover
- On **Disaster Recovery**, click **Simulate Outage & Failover to GCP** to watch the 5-step failover progress pipeline execute end-to-end.

### Restore the Primary Cloud
1. On **Disaster Recovery**, click **Restore Primary Cloud (AWS)**.
2. The recovery workflow verifies AWS health, catches up PostgreSQL replication & object storage sync, shifts routing back to AWS `us-east-1`, and returns GCP to warm standby.

---

## Future AWS & GCP Deployment

See [docs/cloud-deployment-guide.md](docs/cloud-deployment-guide.md) for the exact AWS/GCP services, environment variables, and placeholder modules in `backend/src/cloud/` to configure when deploying to live cloud accounts.
