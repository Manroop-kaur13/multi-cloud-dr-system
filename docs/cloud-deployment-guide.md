# Cloud Deployment Guide (Manual AWS & GCP Configuration)

This guide lists every file, environment variable, and infrastructure component you will configure manually when transitioning from local simulation to live AWS and GCP deployments.

## 1. Files Containing Cloud Integration Placeholders

Update the following isolated adapter modules in `backend/src/cloud/` when ready to connect live cloud SDKs:

1. `backend/src/cloud/awsHealthCheck.js`
   - Install `@aws-sdk/client-route-53` or perform authenticated HTTPS probes to your AWS ALB `/api/health`.
2. `backend/src/cloud/gcpHealthCheck.js`
   - Install `@google-cloud/monitoring` or perform HTTPS probes to your GCP Cloud Run / GKE Ingress `/api/health`.
3. `backend/src/cloud/dnsFailover.js`
   - Implement Route 53 `ChangeResourceRecordSetsCommand` (or Cloudflare Load Balancer API) to shift DNS traffic between AWS and GCP.
4. `backend/src/cloud/cloudDbReplication.js`
   - Connect to AWS RDS PostgreSQL metrics (`ReplicaLag` via CloudWatch) and GCP Cloud SQL promotion API (`sqladmin` / `gcloud sql instances promote-replica`).
5. `backend/src/cloud/objectStorageSync.js`
   - Configure S3 Cross-Region Replication or GCP Storage Transfer Service triggers.

## 2. Environment Variables to Configure

Set these in `deployment/.env` (or your container orchestrator's Secrets Manager):

- `SIMULATION_MODE=false`
- `DB_MODE=postgres`
- `DATABASE_URL` or `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`
- `AWS_REGION` (e.g. `us-east-1`)
- `AWS_PRIMARY_ENDPOINT` (HTTPS URL of your AWS ALB `/api/health`)
- `AWS_ACCESS_KEY_ID` & `AWS_SECRET_ACCESS_KEY` (prefer IAM Roles on ECS/EC2 instead of static keys)
- `AWS_ROUTE53_HOSTED_ZONE_ID`
- `GCP_REGION` (e.g. `us-central1`)
- `GCP_SECONDARY_ENDPOINT` (HTTPS URL of your GCP Load Balancer `/api/health`)
- `GCP_PROJECT_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` (prefer Workload Identity / Service Account attached to Cloud Run/GKE)

## 3. Recommended Deployment Topology

1. **AWS Primary (`us-east-1`):**
   - Build & push `backend/Dockerfile` to Amazon ECR; deploy on ECS Fargate or EC2 behind an Application Load Balancer configured with health check path `/api/health`.
   - Build & push `frontend/Dockerfile` to S3 + CloudFront or ECS.
   - Provision Amazon RDS for PostgreSQL (Multi-AZ recommended) and initialize with `database/schema.sql`.
2. **GCP Warm Standby (`us-central1`):**
   - Build & push `backend/Dockerfile` and `frontend/Dockerfile` to Google Artifact Registry; deploy to Cloud Run or GKE.
   - Provision Cloud SQL for PostgreSQL configured as an external-server logical replica or warm standby from AWS RDS.
3. **DNS Failover:**
   - Create a Route 53 Failover Routing Policy (Primary -> AWS ALB with Route 53 Health Check on `/api/health`, Secondary -> GCP Load Balancer IP/Hostname) with a low TTL (30s).
