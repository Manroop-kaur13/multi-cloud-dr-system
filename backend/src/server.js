import { createApp } from './app.js';
import { env } from './config/env.js';
import { closeDatabaseClient, getDbStatus } from './database/dbClient.js';
import { runMigrationsAndSeed } from './database/migrator.js';
import {
  hydrateLastSuccessTimestamps,
  runHealthCheckCycle,
  startHealthMonitorLoop,
  stopHealthMonitorLoop,
} from './services/healthMonitorService.js';

async function bootstrap() {
  await runMigrationsAndSeed();
  await hydrateLastSuccessTimestamps();
  await runHealthCheckCycle();

  const app = createApp();
  const server = app.listen(env.port, () => {
    const db = getDbStatus();
    console.log(`[Server] Multi-Cloud DR Backend listening on port ${env.port}`);
    console.log(`[Server] Database engine: ${db.engineLabel} (connected=${db.connected})`);
    console.log(`[Server] Simulation mode: ${env.simulationMode}`);
  });

  startHealthMonitorLoop();

  const shutdown = async () => {
    console.log('\n[Server] Shutting down gracefully...');
    stopHealthMonitorLoop();
    server.close(async () => {
      await closeDatabaseClient();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  console.error('[Bootstrap Failed]', err);
  process.exit(1);
});
