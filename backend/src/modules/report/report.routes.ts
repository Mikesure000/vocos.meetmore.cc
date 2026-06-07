import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { authMiddleware } from '../../middleware/auth.js';
import { reportExporter } from './exporters/report-exporter.js';
import { analysisService } from '../insight/analysis.service.js';
import { auditService } from '../admin/audit.service.js';
import * as fs from 'node:fs';

export async function reportRoutes(app: FastifyInstance) {
  // List reports for a task
  app.get('/tasks/:taskId/reports', { preHandler: [authMiddleware] }, async (req) => {
    const { taskId } = req.params as any;
    return prisma.report.findMany({ where: { taskId }, orderBy: { createdAt: 'desc' } });
  });

  // Generate report (v3.7: reads real analysis data from DB)
  app.post('/tasks/:taskId/reports/generate', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { taskId } = req.params as any;
    const { reportType = 'full', reportTitle = '分析报告' } = req.body as any;

    const task = await prisma.analysisTask.findUnique({
      where: { id: taskId },
      include: { project: { select: { projectName: true, brandName: true, category: { select: { name: true, icon: true } } } }, team: { select: { whiteLabelConfig: true } } },
    });
    if (!task) return reply.status(404).send({ message: 'Task not found' });

    // 并行读取所有分析数据
    const [
      strategyCards, comments, productionCards,
      contentAnalysis, attribution, demandMap, barrierMap,
      validCount, spamCount, duplicateCount, highValueCount, threadCount,
    ] = await Promise.all([
      prisma.strategyCard.findMany({ where: { taskId } }),
      prisma.comment.count({ where: { taskId } }),
      prisma.productionCard.findMany({ where: { taskId } }),
      analysisService.getContentAnalysis(taskId).catch(() => ({ data: null, source: 'mock' as const })),
      analysisService.getAttribution(taskId).catch(() => ({ data: null, source: 'mock' as const })),
      analysisService.getDemandMap(taskId).catch(() => ({ data: null, source: 'mock' as const })),
      analysisService.getBarrierMap(taskId).catch(() => ({ data: null, source: 'mock' as const })),
      prisma.comment.count({ where: { taskId, cleanStatus: 'valid' } }),
      prisma.comment.count({ where: { taskId, cleanStatus: 'spam' } }),
      prisma.comment.count({ where: { taskId, cleanStatus: { in: ['duplicate_exact', 'duplicate_fuzzy'] } } }),
      prisma.comment.count({ where: { taskId, valueScore: { gte: 4 } } }),
      prisma.commentThread.count({ where: { taskId } }),
    ]);

    const reportJson = {
      generated: true,
      timestamp: new Date().toISOString(),
      taskInfo: {
        taskName: task.taskName,
        platform: task.platform,
        contentGoal: task.contentGoal,
        projectName: task.project?.projectName,
        brandName: task.project?.brandName,
        category: task.project?.category?.name,
        commentCount: comments,
      },
      contentAnalysis: contentAnalysis?.data || {},
      commentCleaning: {
        originalCount: comments,
        validCount,
        spamCount,
        exactDuplicates: duplicateCount,
        highValueCount,
        replyChainCount: threadCount,
      },
      insights: {
        demands: demandMap?.data?.demands || [],
        barriers: barrierMap?.data?.barriers || [],
        attribution: attribution?.data?.attributions || [],
      },
      strategyCards: strategyCards.map((c) => ({
        priority: c.priority,
        title: c.title,
        platform: c.platform,
        ...JSON.parse(c.cardJson || '{}'),
      })),
      productionCards: productionCards.map((c) => ({
        platform: c.platform,
        ...JSON.parse(c.cardJson || '{}'),
      })),
      whiteLabel: task.team?.whiteLabelConfig ? JSON.parse(task.team.whiteLabelConfig) : {},
    };

    const markdown = reportExporter['jsonToMarkdown'](JSON.stringify(reportJson), reportTitle);

    const report = await prisma.report.create({
      data: {
        taskId,
        reportType,
        reportTitle,
        reportJson: JSON.stringify(reportJson),
        markdownContent: markdown,
      },
    });

    return report;
  });

  // Export report
  app.post('/reports/:id/export', { preHandler: [authMiddleware] }, async (req, reply) => {
    const user = req.user as any;
    const { id } = req.params as any;
    const { format = 'markdown' } = req.body as any;

    const report = await prisma.report.findUnique({ where: { id } });
    if (!report) return reply.status(404).send({ message: 'Report not found' });

    const { filePath, fileSize } = await reportExporter.export(
      report.reportJson,
      format,
      report.reportTitle
    );

    // Record export in DB
    const exp = await prisma.export.create({
      data: {
        reportId: id,
        exportType: format,
        filePath,
        fileSize,
        status: 'completed',
        createdBy: user.id,
      },
    });

    // Audit log
    let taskTeamId = '';
    if (report.taskId) {
      const t = await prisma.analysisTask.findUnique({ where: { id: report.taskId } });
      taskTeamId = t?.teamId || '';
    }
    await auditService.logReportExport(user.id, taskTeamId, id, format);

    return { exportId: exp.id, format, fileSize, fileName: filePath.split(/[\\/]/).pop() };
  });

  // Download exported file
  app.get('/exports/:id/download', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { id } = req.params as any;
    const exp = await prisma.export.findUnique({ where: { id } });
    if (!exp || !fs.existsSync(exp.filePath)) {
      return reply.status(404).send({ message: 'File not found' });
    }

    const stream = fs.createReadStream(exp.filePath);
    const mimeTypes: Record<string, string> = {
      markdown: 'text/markdown',
      html: 'text/html',
      pdf: 'application/pdf',
      word: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      excel: 'text/csv',
      ppt: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    };

    reply.header('Content-Type', mimeTypes[exp.exportType] || 'application/octet-stream');
    reply.header('Content-Disposition', `attachment; filename="${exp.filePath.split(/[\\/]/).pop()}"`);
    return stream;
  });

  // Get report detail
  app.get('/reports/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    return prisma.report.findUnique({ where: { id } });
  });

  // Create share link
  app.post('/reports/:id/share', { preHandler: [authMiddleware] }, async (req) => {
    const user = req.user as any;
    const { id } = req.params as any;
    const { nanoid } = await import('nanoid');
    const token = nanoid(32);

    const link = await prisma.shareLink.create({
      data: { reportId: id, shareToken: token, createdBy: user.id },
    });

    const report = await prisma.report.findUnique({ where: { id } });
    await auditService.logReportShare(user.id, '', id);

    return { ...link, url: `/share/${token}` };
  });

  // View shared report
  app.get('/share/:token', async (req, reply) => {
    const { token } = req.params as any;
    const link = await prisma.shareLink.findUnique({
      where: { shareToken: token },
      include: { report: true },
    });

    if (!link) return reply.status(404).send({ message: '分享链接不存在' });
    if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
      return reply.status(410).send({ message: '分享链接已过期' });
    }

    await prisma.shareLink.update({
      where: { id: link.id },
      data: { viewCount: { increment: 1 } },
    });

    return link.report;
  });
}
