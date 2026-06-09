// App factory — 导出 Fastify 实例供函数型 CloudRun 使用
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { autoInit } from './config/auto-init.js';
import { registerErrorHandler } from './middleware/error-handler.js';

let app: ReturnType<typeof Fastify> | null = null;

export async function createApp() {
  if (app) return app;

  app = Fastify({ logger: false });

  await app.register(cors, { origin: true, credentials: true });
  await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } });
  await app.register(jwt, { secret: env.JWT_SECRET });

  // Health check
  app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // Core routes (login, me)
  await app.register(authRoutes, { prefix: '/api/auth' });

  // Lazy-load remaining routes (won't block startup if not available)
  try {
    const { projectRoutes } = await import('./modules/project/project.routes.js');
    await app.register(projectRoutes, { prefix: '/api' });
  } catch { console.warn('project routes skipped'); }

  try {
    const { taskRoutes } = await import('./modules/task/task.routes.js');
    await app.register(taskRoutes, { prefix: '/api' });
  } catch { console.warn('task routes skipped'); }

  registerErrorHandler(app);

  // Auto-init demo user
  await autoInit();

  return app;
}
