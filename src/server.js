
import { createApp } from './app.js';
import { config } from './config/env.js';
import { createContainer } from './container.js';
import { bootstrapAdmin } from './data/bootstrap-admin.js';
import { createPool } from './db/pool.js';

const pool = createPool();

const container = createContainer({ pool });

try {
  await bootstrapAdmin(container.usersService, config.admin);
} catch (error) {
  console.error('Application startup failed:', error);
  await pool.end();
  process.exit(1);
}

const app = createApp(container);

const server = app.listen(config.port, config.host, () => {
  console.log(
    `👤 Users API on http://${config.host}:${config.port} (${config.env}, pid ${process.pid})`
  );

  if (!container.githubClient.isConfigured) {
    console.log(
      'ℹ️  GitHub login disabled (GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET not set)'
    );
  }
});

function shutdown(signal) {
  console.log(`${signal} received — shutting down`);

  server.close(async () => {
    await pool.end();
    process.exit(0);
  });

  server.closeIdleConnections();
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
