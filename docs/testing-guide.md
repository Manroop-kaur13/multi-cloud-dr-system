# Testing & Verification Guide

## 1. Automated Backend API & Failover Tests

Run the Node.js integration test suite (exercises `/api/health`, `/api/status`, `/api/metrics`, `/api/replication`, automatic failover on threshold breach, and primary recovery):

```bash
cd backend
npm test
```

## 2. Frontend Production Build Check

```bash
cd frontend
npm run build
```

## 3. Manual End-to-End Verification Checklist

1. Start backend (`cd backend && npm start`) and frontend (`cd frontend && npm run dev`).
2. Verify `GET http://localhost:5000/api/health` returns `200 OK` with `"activeCloud": "AWS"`.
3. Open `http://localhost:5173` and inspect all 5 pages:
   - Dashboard
   - Cloud Monitoring
   - Disaster Recovery
   - Database & Replication
   - Event Logs
4. Trigger **Simulate AWS Outage** on Cloud Monitoring, run a second health probe (or wait 5s), and confirm `activeCloud` transitions to `GCP`.
5. Write a sample transaction in **Database & Replication** and verify it appears in the replicated records table.
6. Trigger **Restore Primary Cloud (AWS)** on Disaster Recovery and verify `activeCloud` returns to `AWS`.
