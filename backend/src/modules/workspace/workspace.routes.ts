/**
 * 工作台统计 API
 */
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { authMiddleware } from '../../middleware/auth.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

export async function workspaceRoutes(app: FastifyInstance) {
  // ============ 系统健康检查 ============
  app.get('/workspace/health', { preHandler: [authMiddleware] }, async () => {
    let dbStatus = 'connected';
    let dbError = null;
    try { await prisma.$queryRaw`SELECT 1`; } catch (e: any) { dbStatus = 'disconnected'; dbError = e.message; }

    let version = '0.0.0';
    try {
      const vPath = path.resolve('../../VERSION.md');
      if (fs.existsSync(vPath)) {
        const vContent = fs.readFileSync(vPath, 'utf-8');
        const m = vContent.match(/v(\d+\.\d+\.\d+)/);
        if (m) version = m[1];
      }
    } catch {}

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayRuns = await prisma.aiRun.count({ where: { createdAt: { gte: today } } }).catch(() => 0);
    const totalRuns = await prisma.aiRun.count().catch(() => 0);
    const failRate = totalRuns > 0 ? ((await prisma.aiRun.count({ where: { status: 'failed' } }).catch(() => 0)) / totalRuns * 100).toFixed(1) : '0';

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      version,
      db: { status: dbStatus, error: dbError },
      aiPipeline: { mode: process.env.VOCOS_MODEL_MODE || 'mock', todayRuns, totalRuns, failRate: `${failRate}%` },
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  });
  app.get('/workspace/stats', { preHandler: [authMiddleware] }, async () => {
    const [projects, tasks, completedTasks, reports, comments, strategyCards,
      productionCards, reviews, categoryStats] = await Promise.all([
      prisma.project.count({ where: { status: 'active' } }),
      prisma.analysisTask.count(),
      prisma.analysisTask.count({ where: { status: 'completed' } }),
      prisma.report.count(),
      prisma.comment.count(),
      prisma.strategyCard.count(),
      prisma.productionCard.count(),
      prisma.postPublishReview.count(),
      // 品类统计
      prisma.category.findMany({
        where: { status: 'active' },
        select: { id: true, name: true, icon: true, slug: true, _count: { select: { projects: true } } },
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    // 最近任务（含品类信息）
    const recentTasks = await prisma.analysisTask.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, taskName: true, platform: true, status: true, createdAt: true, projectId: true,
        project: { select: { projectName: true, category: { select: { name: true, icon: true } } } },
      },
    });

    // 今日统计
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTasks = await prisma.analysisTask.count({ where: { createdAt: { gte: today } } });

    return {
      projects, tasks, completedTasks, reports, comments, strategyCards,
      productionCards, reviews, todayTasks, recentTasks,
      categoryStats: categoryStats.map(c => ({
        id: c.id, name: c.name, icon: c.icon, slug: c.slug, projectCount: c._count.projects,
      })),
    };
  });
}
