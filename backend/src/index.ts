import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import { env } from './config/env.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { projectRoutes } from './modules/project/project.routes.js';
import { taskRoutes } from './modules/task/task.routes.js';
import { reportRoutes } from './modules/report/report.routes.js';
import { adminRoutes } from './modules/admin/admin.routes.js';
import { aiRoutes } from './modules/ai/ai.routes.js';
import { commentRoutes } from './modules/comment/comment.routes.js';
import { strategyRoutes } from './modules/strategy/strategy.routes.js';
import { analysisRoutes } from './modules/insight/analysis.routes.js';
import { teamRoutes } from './modules/team/team.routes.js';
import { aiSettingsRoutes } from './modules/ai/ai-settings.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { workspaceRoutes } from './modules/workspace/workspace.routes.js';
import { sseRoutes } from './modules/sse/sse.routes.js';
import { fileRoutes } from './modules/file/file.routes.js';
import { commentDetailRoutes } from './modules/comment/comment-detail.routes.js';
import { aiGovernanceRoutes } from './modules/ai/ai-governance.routes.js';
import { skillRoutes } from './modules/ai/skills/routes.js';
import { learnerRoutes } from './modules/ai/skills/learner-routes.js';
import { categoryRoutes } from './modules/category/category.routes.js';
import { reviewRoutes } from './modules/review/review.routes.js';
import { registerErrorHandler } from './middleware/error-handler.js';

const app = Fastify({ logger: env.NODE_ENV === 'development' });

// Plugins
await app.register(cors, { origin: true, credentials: true });
await app.register(multipart, { limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB
await app.register(jwt, { secret: env.JWT_SECRET });

// Health check
app.get('/api/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
await app.register(authRoutes, { prefix: '/api/auth' });
await app.register(projectRoutes, { prefix: '/api' });
await app.register(taskRoutes, { prefix: '/api' });
await app.register(reportRoutes, { prefix: '/api' });
await app.register(adminRoutes, { prefix: '/api/admin' });
await app.register(aiRoutes, { prefix: '/api' });
await app.register(commentRoutes, { prefix: '/api' });
await app.register(strategyRoutes, { prefix: '/api' });
await app.register(analysisRoutes, { prefix: '/api' });
await app.register(teamRoutes, { prefix: '/api' });
await app.register(aiSettingsRoutes, { prefix: '/api' });
await app.register(searchRoutes, { prefix: '/api' });
await app.register(workspaceRoutes, { prefix: '/api' });
await app.register(sseRoutes, { prefix: '/api' });
await app.register(fileRoutes, { prefix: '/api' });
await app.register(commentDetailRoutes, { prefix: '/api' });
await app.register(aiGovernanceRoutes, { prefix: '/api/admin' });

await app.register(skillRoutes, { prefix: '/api' });
await app.register(learnerRoutes, { prefix: '/api' });
await app.register(categoryRoutes, { prefix: '/api' });
await app.register(reviewRoutes, { prefix: '/api' });

// Error handler (must be registered after all routes)
registerErrorHandler(app);

// Start
try {
  await app.listen({ host: env.HOST, port: env.PORT });
  console.log(`[VocosAI] Server running at http://${env.HOST}:${env.PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}

// 优雅关闭
const gracefulShutdown = async (signal: string) => {
  console.log(`[VocosAI] Received ${signal}, shutting down gracefully...`);
  try {
    await app.close();
    console.log('[VocosAI] Server closed');
    process.exit(0);
  } catch (err) {
    console.error('[VocosAI] Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常处理（防止崩溃）
process.on('uncaughtException', (err) => {
  console.error('[VocosAI] Uncaught Exception:', err.message);
  console.error(err.stack);
  // 不退出进程，记录错误后继续运行
});

process.on('unhandledRejection', (reason: any) => {
  console.error('[VocosAI] Unhandled Rejection:', reason?.message || reason);
  // 不退出进程
});

export { app };
