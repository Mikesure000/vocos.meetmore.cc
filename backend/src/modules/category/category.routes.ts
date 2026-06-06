import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { authMiddleware } from '../../middleware/auth.js';

export async function categoryRoutes(app: FastifyInstance) {
  // 品类列表（公开可读）
  app.get('/categories', { preHandler: [authMiddleware] }, async () => {
    const categories = await prisma.category.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        description: true,
        sortOrder: true,
      },
    });
    return categories;
  });

  // 品类详情（含知识库）
  app.get('/categories/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { projects: true } } },
    });
    if (!category) return { error: '品类不存在' };
    return {
      ...category,
      knowledgeBase: JSON.parse(category.knowledgeBase),
      complianceRules: JSON.parse(category.complianceRules),
      platformMethodology: JSON.parse(category.platformMethodology),
      projectCount: category._count.projects,
      _count: undefined,
    };
  });

  // 按 slug 获取品类
  app.get('/categories/slug/:slug', { preHandler: [authMiddleware] }, async (req) => {
    const { slug } = req.params as any;
    const category = await prisma.category.findUnique({ where: { slug } });
    if (!category) return { error: '品类不存在' };
    return {
      ...category,
      knowledgeBase: JSON.parse(category.knowledgeBase),
      complianceRules: JSON.parse(category.complianceRules),
      platformMethodology: JSON.parse(category.platformMethodology),
    };
  });
}
