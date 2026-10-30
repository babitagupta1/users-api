
import cookieParser from 'cookie-parser';
import express from 'express';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { requestId } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { requireJson } from './middleware/require-json.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createUsersRouter } from './routes/users.routes.js';

export function createApp(container) {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');

  // 1. App-level middleware
  app.use(requestId);

  if (!config.isTest) {
    app.use(requestLogger);
  }

  app.use(requireJson);
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(cookieParser());

  // 2. Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      uptimeSec: Math.round(process.uptime()),
    });
  });

  // 3. Serve uploaded files from local disk
  if (container.uploads.driver === 'local') {
    app.use(
      '/uploads',
      express.static(container.uploads.localDir, {
        index: false,
        dotfiles: 'deny',
        immutable: true,
        maxAge: '365d',
        setHeaders: (res) => {
          res.set('X-Content-Type-Options', 'nosniff');
        },
      }),
    );
  }

  // 4. API routes
  app.use('/api/v1/auth', createAuthRouter(container));
  app.use('/api/v1/users', createUsersRouter(container));

  // 5. Fallbacks and error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
