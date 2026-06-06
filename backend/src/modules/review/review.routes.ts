import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { authMiddleware } from '../../middleware/auth.js';

export async function reviewRoutes(app: FastifyInstance) {
  // 创建复盘任务
  app.post('/reviews', { preHandler: [authMiddleware] }, async (req) => {
    const user = req.user as any;
    const body = req.body as any;
    const review = await prisma.postPublishReview.create({
      data: {
        taskId: body.taskId,
        newContentUrl: body.newContentUrl,
        newContentTitle: body.newContentTitle,
        newContentBody: body.newContentBody,
        metrics: body.metrics ? JSON.stringify(body.metrics) : null,
        strategyExecutionScore: 0,
        createdBy: user.id,
      },
    });
    return review;
  });

  // 获取任务关联的复盘列表
  app.get('/reviews/task/:taskId', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    const reviews = await prisma.postPublishReview.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
    });
    return reviews.map((r) => ({
      ...r,
      metrics: r.metrics ? JSON.parse(r.metrics) : null,
      commentChangeAssessment: r.commentChangeAssessment
        ? JSON.parse(r.commentChangeAssessment)
        : null,
      nextRoundSuggestions: r.nextRoundSuggestions
        ? JSON.parse(r.nextRoundSuggestions)
        : null,
    }));
  });

  // 获取单个复盘
  app.get('/reviews/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    const review = await prisma.postPublishReview.findUnique({
      where: { id },
      include: { task: { select: { taskName: true, platform: true } } },
    });
    if (!review) return { error: '复盘记录不存在' };
    return {
      ...review,
      metrics: review.metrics ? JSON.parse(review.metrics) : null,
      commentChangeAssessment: review.commentChangeAssessment
        ? JSON.parse(review.commentChangeAssessment)
        : null,
      nextRoundSuggestions: review.nextRoundSuggestions
        ? JSON.parse(review.nextRoundSuggestions)
        : null,
    };
  });

  // 提交复盘结果
  app.put('/reviews/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    const body = req.body as any;
    const updateData: Record<string, any> = { status: 'completed' };
    if (body.metrics) updateData.metrics = JSON.stringify(body.metrics);
    if (body.strategyExecutionScore !== undefined) updateData.strategyExecutionScore = body.strategyExecutionScore;
    if (body.commentChangeAssessment) updateData.commentChangeAssessment = JSON.stringify(body.commentChangeAssessment);
    if (body.nextRoundSuggestions) updateData.nextRoundSuggestions = JSON.stringify(body.nextRoundSuggestions);
    if (body.cardEffectivenessScore !== undefined) updateData.cardEffectivenessScore = body.cardEffectivenessScore;
    const review = await prisma.postPublishReview.update({
      where: { id },
      data: updateData,
    });
    return review;
  });

  // 列表
  app.get('/reviews', { preHandler: [authMiddleware] }, async () => {
    const reviews = await prisma.postPublishReview.findMany({
      include: { task: { select: { taskName: true, platform: true } } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return reviews.map((r) => ({
      ...r,
      metrics: r.metrics ? JSON.parse(r.metrics) : null,
      taskName: r.task?.taskName,
      task: undefined,
    }));
  });
}
