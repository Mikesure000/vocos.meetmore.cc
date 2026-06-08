import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { authMiddleware } from '../../middleware/auth.js';

export async function strategyRoutes(app: FastifyInstance) {
  // Get strategy cards for a task
  app.get('/tasks/:taskId/strategy-cards', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    return prisma.strategyCard.findMany({
      where: { taskId },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });
  });

  // Create a strategy card
  app.post('/tasks/:taskId/strategy-cards', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    const body = req.body as any;

    return prisma.strategyCard.create({
      data: {
        taskId,
        priority: body.priority || 'P1',
        title: body.title,
        platform: body.platform,
        cardJson: body.cardJson || JSON.stringify(body),
        status: 'pending',
      },
    });
  });

  // Update strategy card (adopt/edit/reject)
  app.put('/tasks/:taskId/strategy-cards/:cardId', { preHandler: [authMiddleware] }, async (req) => {
    const user = req.user as any;
    const { taskId, cardId } = req.params as any;
    const body = req.body as any;

    const update: any = {};
    if (body.status) update.status = body.status;
    if (body.title) update.title = body.title;
    if (body.priority) update.priority = body.priority;
    if (body.cardJson) update.cardJson = body.cardJson;
    if (body.status === 'adopted') {
      update.adoptedBy = user.id;
      update.adoptedAt = new Date();
    }

    return prisma.strategyCard.updateMany({
      where: { id: cardId, taskId },
      data: update,
    });
  });

  // Delete strategy card
  app.delete('/tasks/:taskId/strategy-cards/:cardId', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId, cardId } = req.params as any;
    await prisma.strategyCard.deleteMany({ where: { id: cardId, taskId } });
    return { message: '策略卡已删除' };
  });

  // Get production cards for a task
  app.get('/tasks/:taskId/production-cards', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    const { platform } = req.query as any;
    const where: any = { taskId };
    if (platform) where.platform = platform;

    return prisma.productionCard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  });

  // Create production card
  app.post('/tasks/:taskId/production-cards', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    const body = req.body as any;

    return prisma.productionCard.create({
      data: {
        taskId,
        strategyCardId: body.strategyCardId,
        platform: body.platform,
        cardJson: body.cardJson || JSON.stringify(body),
        status: 'pending',
      },
    });
  });

  // Update production card
  app.put('/tasks/:taskId/production-cards/:cardId', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId, cardId } = req.params as any;
    const body = req.body as any;

    const update: any = {};
    if (body.status) update.status = body.status;
    if (body.cardJson) update.cardJson = body.cardJson;
    if (body.status === 'adopted') update.adoptedAt = new Date();
    if (body.cardJson) update.editCount = { increment: 1 };

    return prisma.productionCard.updateMany({
      where: { id: cardId, taskId },
      data: update,
    });
  });

  // Delete production card
  app.delete('/tasks/:taskId/production-cards/:cardId', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId, cardId } = req.params as any;
    await prisma.productionCard.deleteMany({ where: { id: cardId, taskId } });
    return { message: '生产卡已删除' };
  });

  // Generate AI strategy cards (v4.3: DB-first, then richer mock)
  app.post('/tasks/:taskId/strategy-cards/generate', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { taskId } = req.params as any;

    // Check existing from Pipeline run
    const existing = await prisma.strategyCard.findMany({ where: { taskId }, orderBy: { createdAt: 'desc' } });
    if (existing.length > 0) {
      return { message: '已有策略卡（从分析管道生成）', count: existing.length, cards: existing, source: 'pipeline' };
    }

    // Generate fallback cards with enriched v4.3 data
    const cards = [
      { priority: 'P0', title: '制作价值拆解视频：它凭什么比平替贵？', platform: 'douyin',
        cardJson: JSON.stringify({
          contentOpportunity: '价格异议评论占高价值评论的31%，用户不是嫌贵是不理解价值来源',
          commentEvidence: ['这个和几十块的有什么区别？', '贵在哪里？', '是不是智商税？', '真的值这个价吗？'],
          userPainPoint: '价格敏感但品质有追求，需要价值说服',
          userBarrier: '价值认知不足，缺少价格锚点', coreJudgment: '需要一条价值拆解内容建立价格锚点',
          suggestedPlatform: 'douyin', contentFormat: '口播+对比展示', suggestedGoal: '转化成交',
          estimatedValue: '预计可降低价格异议评论40%，CVR提升15%', riskWarning: '避免贬低竞品，聚焦自身价值差异',
          nextAction: '准备成分对比、工艺差异、用户反馈素材',
          platformStrategy: {
            douyin: '开头：评论截图+大字"贵在哪里？"→ 3维度拆解（成分/工艺/效果）→ 适合/不适合人群 → 投票互动',
            xiaohongshu: '标题：它凭什么比平替贵？4个维度拆清楚 → 收藏引导 → 评论区收集对比对象',
          },
          verifyMetrics: ['价格异议评论占比下降', 'CVR提升', '客单价接受度'],
        }),
      },
      { priority: 'P1', title: '分肤质使用教程', platform: 'xiaohongshu',
        cardJson: JSON.stringify({
          contentOpportunity: '肤质适配问题占高价值评论25%，用户需要个性化指导',
          commentEvidence: ['适合油皮吗？', '干皮会不会干？', '敏感肌能用吗？', '混油皮怎么用？'],
          userPainPoint: '不确定产品是否适合自己肤质', userBarrier: '缺乏场景化使用指导',
          coreJudgment: '分肤质教程可覆盖最大的信息缺口，提升种草转化',
          suggestedPlatform: 'xiaohongshu', contentFormat: '图文教程+分肤质对比', suggestedGoal: '种草收藏',
          estimatedValue: '预计可提升收藏率25%，降低肤质相关咨询30%', riskWarning: '需确保分肤质指导专业准确',
          nextAction: '拍摄油皮/干皮/敏感肌/混油皮4版使用教程',
          platformStrategy: { xiaohongshu: '标题：油皮怎么用？干皮怎么用？一篇讲清楚 → 分肤质教程 → 收藏引导 → "你是什么肤质？"互动' },
          verifyMetrics: ['收藏率', '肤质相关评论减少', 'DM咨询转化'],
        }),
      },
    ];

    const created = [];
    for (const card of cards) {
      created.push(await prisma.strategyCard.create({ data: { taskId, ...card } }));
    }
    return { message: '策略卡生成完成', count: created.length, cards: created, source: 'generated' };
  });

  // Generate AI production cards (v4.3: DB-first, then richer mock)
  app.post('/tasks/:taskId/production-cards/generate', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { taskId } = req.params as any;
    const { platform } = req.body as any;

    // Check existing from Pipeline
    const existing = await prisma.productionCard.findMany({ where: { taskId, platform: platform || undefined }, orderBy: { createdAt: 'desc' } });
    if (existing.length > 0) {
      return { message: '已有生产卡（从分析管道生成）', cards: existing, source: 'pipeline' };
    }

    // Generate enriched v4.3 fallback
    const cardJson = platform === 'douyin'
      ? JSON.stringify({
          contentGoal: '解决价格异议，建立价值认知，提高转化信任',
          targetUser: '18-35岁精致女性，对产品感兴趣但需价值说服',
          userPainPoint: '不理解产品价值来源，缺少价格锚点',
          commentEvidence: ['这个和几十块的有什么区别？', '贵在哪里？', '是不是智商税？', '真的值这个价吗？'],
          coreJudgment: '用户非支付能力问题，是价值认知缺口',
          contentDirection: '做一条"贵在哪里"的价值拆解视频',
          titleOptions: ['它凭什么比平替贵？看完这3点再决定', '评论区都在问贵在哪里，我一次讲清楚', '把XX和XX放大100倍，差别一目了然'],
          hook: '评论区都在问：它到底凭什么比几十块的贵？',
          structure: ['评论质疑截图(0-3s)', '承认疑问合理(3-8s)', '拆解3维差异(8-50s): 成分浓度/工艺标准/安全认证', '真实反馈展示(50-70s)', '适合/不适合人群(70-80s)', '引导投票下一个想看对比的对象(80-90s)'],
          materialNeeds: ['评论截图', '成分对比表', '产品显微镜对比图', '用户反馈截图', '检测报告截图'],
          sellingPoints: '3个核心差异：成分浓度高30%、使用周期缩短50%、安全认证多3项',
          proofMechanism: '第三方检测数据 + 素人28天前后对比',
          cta: '你觉得最需要对比哪一点？评论区告诉我！',
          commentGuide: '引导用户评论"下一个想看的对比对象"',
          adFitSuggestion: '适合中等预算投放，建议A/B测试3版开头（质疑型/数据型/用户型）',
          acceptanceCriteria: ['必须直接回应价格质疑', '必须有3个以上的量化对比数据', '不能只说"品质好"而没有具体证据', '必须明确注明适合和不适合人群'],
          verificationMetrics: ['CTR>3%', '完播率>25%', '商品点击率>2%', '价格异议评论占比下降>30%', 'CVR>1.5%'],
        })
      : JSON.stringify({
          contentGoal: '分肤质使用教程，提升收藏和种草转化',
          targetUser: '油皮/干皮/敏感肌/混油皮用户，对产品适配有疑问',
          userPainPoint: '不确定产品是否适合自己肤质', commentEvidence: ['适合油皮吗？', '干皮会不会干？', '敏感肌能用吗？'],
          coreJudgment: '分肤质教程可覆盖最大的信息缺口',
          titleOptions: ['油皮怎么用？干皮怎么用？一篇讲清楚', '4种肤质的真实使用感受，看完再决定', '不同肤质用它效果差多少？真实对比来了'],
          coverText: '油皮 VS 干皮 VS 敏感肌 VS 混油皮 — 使用全攻略',
          coreKeywords: ['肤质', '使用方法', '真实感受', '油皮', '干皮', '敏感肌', '混油皮', '测评'],
          searchLayout: '布局"油皮+产品名""干皮+产品名""敏感肌+产品名"等长尾关键词',
          bodyStructure: ['开头：肤质自测引导('你是哪种肤质？')', '中段：四肤质步骤详解(油皮版/干皮版/敏感肌版/混油版)', '结尾：常见问题Q&A + 收藏引导 + "下一篇想看什么？"互动'],
          noteType: '图文教程 + 收藏清单', collectionPoints: ['肤质自测清单', '分肤质使用步骤表', '季节性搭配建议'],
          materialNeeds: ['四肤质对比图', '使用步骤分镜图', '28天使用记录图'],
          sellingPoints: '不同肤质的差异化效果展示', proofMechanism: '28天真实使用记录 + 周期对比照片',
          interactionQuestions: ['你是什么肤质？', '还有其他使用问题吗？评论区告诉我'],
          cta: '收藏这篇，下次不知道怎么用就翻出来看！',
          avoidanceTips: ['不要只说"适合所有肤质"', '不要忽略敏感肌的特殊需求', '不要过度承诺效果'],
          acceptanceCriteria: ['必须有四肤质具体步骤', '必须有真实使用场景照片', '必须有Q&A互动环节', '必须有收藏引导'],
          verificationMetrics: ['收藏率>5%', '评论互动率>3%', '私信咨询转化', '笔记涨粉数'],
        });

    const card = await prisma.productionCard.create({ data: { taskId, platform: platform || 'douyin', cardJson, status: 'pending' } });
    return { message: '生产卡生成完成', card, source: 'generated' };
  });
}
