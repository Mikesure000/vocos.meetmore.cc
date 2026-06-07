import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { authMiddleware } from '../../middleware/auth.js';
import { orchestrator } from '../ai/workflow/orchestrator.js';
import { detectSignals, getAllSignals } from '../comment/comment-signals.js';
import { parseCommentFile } from '../comment/universal-parser.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

export async function taskRoutes(app: FastifyInstance) {
  app.get('/tasks', { preHandler: [authMiddleware] }, async (req) => {
    const { projectId } = req.query as any;
    return prisma.analysisTask.findMany({
      where: projectId ? { projectId } : {},
      orderBy: { createdAt: 'desc' },
    });
  });

  app.post('/tasks', { preHandler: [authMiddleware] }, async (req) => {
    const user = req.user as any;
    const body = req.body as any;
    return prisma.analysisTask.create({
      data: {
        teamId: body.teamId || 'default',
        projectId: body.projectId,
        taskName: body.taskName,
        platform: body.platform,
        contentUrl: body.contentUrl,
        contentTitle: body.contentTitle,
        contentBody: body.contentBody,
        contentGoal: body.contentGoal,
        brandInfo: body.brandInfo,
        productInfo: body.productInfo,
        competitorInfo: body.competitorInfo,
        outputOptions: JSON.stringify(body.outputOptions || []),
        createdBy: user.id,
      },
    });
  });

  // ============ 上传评论文件（支持 xlsx/csv） ============
  app.post('/tasks/:taskId/upload', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { taskId } = req.params as any;
    const data = await req.file();
    if (!data) return reply.status(400).send({ message: 'No file uploaded' });

    const uploadDir = path.resolve('data/uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    const filename = `${taskId}-${Date.now()}-${data.filename}`;
    const filePath = path.join(uploadDir, filename);
    const buffer = await data.toBuffer();
    fs.writeFileSync(filePath, buffer);

    const isExcel = data.filename.endsWith('.xlsx') || data.filename.endsWith('.xls');
    const isCsv = data.filename.endsWith('.csv');

    // 使用 douyin-parser 解析
    let parseResult;
    if (isExcel || isCsv) {
      parseResult = parseCommentFile(filePath);
    } else {
      return reply.status(400).send({ message: '不支持的文件格式，请上传 .xlsx 或 .csv 文件' });
    }

    // 保存文件记录
    await prisma.commentFile.create({
      data: {
        taskId,
        fileName: data.filename,
        filePath,
        fileType: isExcel ? 'xlsx' : 'csv',
        fileSize: buffer.length,
        rowCount: parseResult.stats.total,
        mappingConfig: JSON.stringify(parseResult.mappedColumns),
        parseStatus: 'completed',
      },
    });

    // 更新任务状态
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { status: 'mapping_required' },
    });

    return {
      columns: parseResult.columns,
      mappedColumns: parseResult.mappedColumns,
      platform: parseResult.platform,
      stats: parseResult.stats,
      preview: parseResult.comments.slice(0, 5).map((c) => ({
        commentText: c.commentText,
        likeCount: c.likeCount,
        signals: c.signals,
        valueScore: c.valueScore,
        cleanStatus: c.cleanStatus,
        isReply: c.isReply,
      })),
    };
  });

  // ============ 确认字段映射 + 评论入库 ============
  app.post('/tasks/:taskId/confirm-mapping', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { taskId } = req.params as any;
    const { mapping } = req.body as any; // 用户手动调整的映射

    // 重新读取文件并解析
    const commentFile = await prisma.commentFile.findFirst({ where: { taskId } });
    if (!commentFile || !fs.existsSync(commentFile.filePath)) {
      return reply.status(400).send({ message: '文件不存在，请重新上传' });
    }

    const parseResult = parseCommentFile(commentFile.filePath);

    // 如果用户手动调整了映射，合并
    const finalMapping = { ...parseResult.mappedColumns, ...mapping };

    // 批量入库评论
    const batchSize = 500;
    let inserted = 0;

    for (let i = 0; i < parseResult.comments.length; i += batchSize) {
      const batch = parseResult.comments.slice(i, i + batchSize);
      const commentRows = batch.map((c) => ({
        taskId,
        commentIdExternal: c.commentIdExternal,
        commentText: c.commentText,
        normalizedText: c.normalizedText,
        likeCount: c.likeCount,
        replyCount: c.replyCount,
        createdAtExternal: c.createdAtExternal ? new Date(c.createdAtExternal) : null,
        userIdHash: c.userIdHash,
        userNameHash: c.userNameHash,
        parentCommentId: c.parentCommentId,
        parentCommentText: c.parentCommentText,
        quotedCommentId: c.quotedCommentId,
        quotedCommentText: c.quotedCommentText,
        isReply: c.isReply,
        cleanStatus: c.cleanStatus,
        valueScore: c.valueScore,
        signalLabels: JSON.stringify(c.signals),
        ipLocation: c.ipLocation,
        videoId: c.videoId,
        videoUrl: c.videoUrl,
        douyinId: c.douyinId,
      }));

      try {
        await prisma.comment.createMany({ data: commentRows });
        inserted += commentRows.length;
      } catch (err) {
        console.error(`Batch insert error at offset ${i}:`, err);
      }
    }

    // 更新文件记录
    await prisma.commentFile.update({
      where: { id: commentFile.id },
      data: {
        mappingConfig: JSON.stringify(finalMapping),
        rowCount: inserted,
      },
    });

    // 更新任务状态
    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { status: 'ready' },
    });

    return {
      message: `评论数据入库完成`,
      totalParsed: parseResult.stats.total,
      inserted,
      stats: parseResult.stats,
    };
  });

  // ============ 启动分析 ============
  app.post('/tasks/:taskId/start', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { taskId } = req.params as any;
    const user = req.user as any;
    const task = await prisma.analysisTask.findUnique({
      where: { id: taskId },
      include: { project: { select: { categoryId: true, brandName: true } } },
    });
    if (!task) return reply.status(404).send({ message: 'Task not found' });

    await prisma.analysisTask.update({
      where: { id: taskId },
      data: { status: 'analyzing', startedAt: new Date() },
    });

    const commentCount = await prisma.comment.count({ where: { taskId } });

    // 加载品类知识库
    let categoryInfo: string | undefined;
    if (task.project?.categoryId) {
      const cat = await prisma.category.findUnique({ where: { id: task.project.categoryId } });
      if (cat) {
        categoryInfo = JSON.stringify({ name: cat.name, keyConcerns: JSON.parse(cat.knowledgeBase || '{}').keyConcerns || [], dimensions: JSON.parse(cat.knowledgeBase || '{}').dimensions || [], complianceRules: JSON.parse(cat.complianceRules || '[]'), platformMethodology: JSON.parse(cat.platformMethodology || '{}') });
      }
    }

    // 加载品牌知识库
    let brandKnowledge: string | undefined;
    if (task.project?.brandName) {
      const brand = await prisma.brand.findFirst({ where: { name: task.project.brandName } });
      if (brand) {
        brandKnowledge = JSON.stringify({ brandName: brand.name, positioning: brand.positioning, sellingPoints: brand.sellingPoints, taboos: brand.taboos || [] });
      }
    }

    orchestrator.runPipeline({
      taskId: task.id,
      teamId: task.teamId,
      projectId: task.projectId,
      createdBy: user.id,
      contentTitle: task.contentTitle || '',
      contentBody: task.contentBody || '',
      platform: task.platform,
      contentGoal: task.contentGoal || '',
      brandInfo: task.brandInfo || '',
      outputOptions: task.outputOptions ? JSON.parse(task.outputOptions) : [],
      commentCount,
      categoryInfo,
      brandKnowledge,
    }).catch(console.error);

    return { message: '分析任务已启动', status: 'analyzing', commentCount };
  });

  // ============ 任务状态/详情/信号统计/洞察/信号定义 ============
  app.get('/tasks/:taskId/status', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    const task = await prisma.analysisTask.findUnique({
      where: { id: taskId },
      select: { status: true, progress: true },
    });
    if (!task) return { status: 'not_found' };
    const progress = task.progress ? JSON.parse(task.progress) : { currentStep: 0, totalSteps: 17, steps: [] };
    return { ...task, ...progress };
  });

  app.get('/tasks/:taskId', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    return prisma.analysisTask.findUnique({ where: { id: taskId } });
  });

  app.get('/tasks/:taskId/comment-signals', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    const comments = await prisma.comment.findMany({
      where: { taskId, cleanStatus: 'valid' },
      select: { signalLabels: true, valueScore: true },
    });
    const signalCounts: Record<string, number> = {};
    comments.forEach((c) => {
      if (c.signalLabels) {
        try { JSON.parse(c.signalLabels).forEach((l: string) => { signalCounts[l] = (signalCounts[l] || 0) + 1; }); } catch {}
      }
    });
    return { signalCounts, totalComments: comments.length };
  });

  app.get('/comment-signal-definitions', { preHandler: [authMiddleware] }, async () => getAllSignals());

  app.get('/tasks/:taskId/insights', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    return prisma.commentInsight.findMany({ where: { taskId } });
  });
}
