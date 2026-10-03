import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './server/config/env.js';
import { requestIdMiddleware } from './server/middleware/requestId.js';
import { errorHandler } from './server/middleware/errorHandler.js';
import { createApiRouter } from './server/routes/api.js';
import { logger } from './server/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = env.PORT || 3000;

  // Global middlewares
  app.use(express.json({ limit: '1mb' }));
  app.use(requestIdMiddleware);

  // Mount API router
  app.use('/api', createApiRouter());

  // Error handling middleware
  app.use(errorHandler);

  // Development: Mount Vite server middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve pre-built static files
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Freshdesk Agent Connector listening on port ${PORT}`, {
      action: 'server_startup',
      demo_mode: env.DEMO_MODE,
      provider: env.DEMO_MODE ? 'DemoProvider' : 'FreshdeskLiveProvider',
    });
    console.log(`\n======================================================`);
    console.log(` Freshdesk Agent Connector — MCP Merchant Support`);
    console.log(` Port: ${PORT}`);
    console.log(` Mode: ${env.DEMO_MODE ? 'DEMO MODE (Fictional Data)' : 'LIVE FRESHDESK MODE'}`);
    console.log(` Base API: http://localhost:${PORT}/api`);
    console.log(` Health:   http://localhost:${PORT}/api/health`);
    console.log(` MCP Tools: http://localhost:${PORT}/api/tools`);
    console.log(`======================================================\n`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});
