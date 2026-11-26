import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..', '..');

const envCandidates = [
  path.join(projectRoot, 'backend', '.env'),
  path.join(projectRoot, 'deployment', '.env'),
  path.join(projectRoot, '.env'),
];

for (const envPath of envCandidates) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const parseBoolean = (value, fallback) => {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value).toLowerCase() === 'true';
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseNumber(process.env.PORT, 5000),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  cloudRole: process.env.CLOUD_ROLE || 'SIMULATION_CONTROLLER',
  simulationMode: parseBoolean(process.env.SIMULATION_MODE, true),
  db: {
    mode: (process.env.DB_MODE || 'auto').toLowerCase(),
    connectionString: process.env.DATABASE_URL || '',
    host: process.env.PGHOST || 'localhost',
    port: parseNumber(process.env.PGPORT, 5432),
    user: process.env.PGUSER || 'postgres',
    password: process.env.PGPASSWORD || '',
    database: process.env.PGDATABASE || 'multicloud_dr',
  },
  monitoring: {
    intervalMs: parseNumber(process.env.HEALTH_CHECK_INTERVAL_MS, 5000),
    failureThreshold: parseNumber(process.env.FAILURE_THRESHOLD, 2),
    autoFailoverEnabled: parseBoolean(process.env.AUTO_FAILOVER_ENABLED, true),
    rtoTargetSeconds: parseNumber(process.env.RTO_TARGET_SECONDS, 15),
    rpoTargetSeconds: parseNumber(process.env.RPO_TARGET_SECONDS, 5),
  },
  clouds: {
    aws: {
      region: process.env.AWS_REGION || 'us-east-1',
      endpoint: process.env.AWS_PRIMARY_ENDPOINT || 'https://primary.aws-sim.example.internal/api/health',
      route53HostedZoneId: process.env.AWS_ROUTE53_HOSTED_ZONE_ID || '',
      hasCredentials: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    },
    gcp: {
      region: process.env.GCP_REGION || 'us-central1',
      endpoint: process.env.GCP_SECONDARY_ENDPOINT || 'https://standby.gcp-sim.example.internal/api/health',
      projectId: process.env.GCP_PROJECT_ID || '',
      hasCredentials: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS),
    },
  },
  paths: {
    projectRoot,
    schemaSql: path.join(projectRoot, 'database', 'schema.sql'),
    seedSql: path.join(projectRoot, 'database', 'seed.sql'),
  },
};
