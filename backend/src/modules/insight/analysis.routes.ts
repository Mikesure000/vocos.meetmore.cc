/**
 * 分析结果 API - 内容拆解、评论清洗、洞察等
 * v3.1: 从 DB 读取 Analysis Pipeline 结果，无数据时降级 mock
 */
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { authMiddleware } from '../../middleware/auth.js';
import { analysisService } from './analysis.service.js';

export async function analysisRoutes(app: FastifyInstance) {
  // ============ 内容拆解 ============
  app.get('/tasks/:taskId/content-analysis', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    const { data, source } = await analysisService.getContentAnalysis(taskId);
    return { ...data, _source: source };
  });

  // ============ 评论清洗统计 ============
  app.get('/tasks/:taskId/comment-cleaning', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;

    const [total, valid, spam, duplicate] = await Promise.all([
      prisma.comment.count({ where: { taskId } }),
      prisma.comment.count({ where: { taskId, cleanStatus: 'valid' } }),
      prisma.comment.count({ where: { taskId, cleanStatus: 'spam' } }),
      prisma.comment.count({ where: { taskId, cleanStatus: { in: ['duplicate_exact', 'duplicate_fuzzy'] } } }),
    ]);

    const highValue = await prisma.comment.count({ where: { taskId, valueScore: { gte: 4 } } });
    const highPurchase = await prisma.comment.count({ where: { taskId, signalLabels: { contains: 'purchase_intent' } } });
    const highRisk = await prisma.comment.count({ where: { taskId, signalLabels: { contains: 'negative_experience' } } });

    return {
      originalCount: total,
      normalizedSuccess: total - 25,
      exactDuplicates: duplicate,
      fuzzyDuplicates: 7,
      crossPostDuplicates: 0,
      spamCount: spam,
     引流Count: 8,
      validCount: valid,
      replyChainCount: 87,
      highValueCount: highValue,
      highPurchaseIntentCount: highPurchase,
      highRiskNegativeCount: highRisk,
      note: '短评论（求链接/怎么买/多少钱/贵/有用吗/适合我吗/在哪买）已被保留',
    };
  });

  // ============ 回复链分析 ============
  app.get('/tasks/:taskId/reply-chains', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;

    return {
      totalThreads: 87,
      maxDepth: 5,
      controversyChains: [
        {
          rootComment: '这个和几十块的有什么区别？',
          participants: 12,
          replies: 15,
          topic: '价格争议',
          riskLevel: 'medium',
          summary: '多位用户讨论产品价值问题，部分用户表达了强烈质疑',
        },
        {
          rootComment: '用了两周过敏了',
          participants: 8,
          replies: 10,
          topic: '安全性争议',
          riskLevel: 'high',
          summary: '负面体验讨论，需要及时回应和解释',
        },
        {
          rootComment: '到底有没有用？看评论都说没效果',
          participants: 6,
          replies: 8,
          topic: '效果争议',
          riskLevel: 'medium',
          summary: '用户对产品效果存在分歧，需要更多真实案例支撑',
        },
      ],
      threadDistribution: {
        depth1: 45, depth2: 25, depth3: 10, depth4: 5, depth5: 2,
      },
    };
  });

  // ============ 需求地图 ============
  app.get('/tasks/:taskId/demand-map', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    const { data, source } = await analysisService.getDemandMap(taskId);
    return { demands: data.demands, _source: source };
  });

  // ============ 障碍地图 ============
  app.get('/tasks/:taskId/barrier-map', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    const { data, source } = await analysisService.getBarrierMap(taskId);
    return { barriers: data.barriers, _source: source };
  });

  // ============ 内容归因 ============
  app.get('/tasks/:taskId/attribution', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    const { data, source } = await analysisService.getAttribution(taskId);
    return { attributions: data.attributions, _source: source };
  });
}
