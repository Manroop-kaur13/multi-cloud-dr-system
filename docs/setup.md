# Local Setup Guide

## Prerequisites
- **Node.js** >= 20
- **npm** >= 10
- **Optional for containerized / full DB mode:** Docker & Docker Compose, or a local PostgreSQL 16 instance

## Option A: Local Node.js Development
1. Copy `deployment/.env.example` to `deployment/.env` and review values.
2. Start Backend:
   ```bash
   cd backend
   npm install
   npm start
   ```
   - If PostgreSQL is running on `PGHOST:PGPORT` with valid credentials, the backend connects via `pg.Pool` and ensures schema + seed tables exist.
   - If PostgreSQL is unavailable and `DB_MODE=auto`, the backend starts `pg-mem` automatically for local demonstration without errors.
3. Start Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
4. Open `http://localhost:5173`.

## Option B: Docker Compose Stack
1. Copy `deployment/.env.example` to `deployment/.env` and set `PGPASSWORD`.
2. Build and start all 3 containers (`postgres`, `backend`, `frontend`):
   ```bash
   docker compose -f deployment/docker-compose.yml --env-file deployment/.env up --build -d
   ```
3. Verify:
   - `http://localhost:3000` (Frontend Dashboard)
   - `http://localhost:5000/api/health` (Backend Health Endpoint)
