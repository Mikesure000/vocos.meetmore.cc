import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { authMiddleware } from '../../middleware/auth.js';

export async function projectRoutes(app: FastifyInstance) {
  // List projects
  app.get('/projects', { preHandler: [authMiddleware] }, async (req) => {
    const user = req.user as any;
    const projects = await prisma.project.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { tasks: true } },
        category: { select: { id: true, name: true, slug: true, icon: true } },
      },
    });
    return projects.map((p) => ({
      ...p,
      taskCount: p._count.tasks,
      _count: undefined,
    }));
  });

  // Create project
  app.post('/projects', { preHandler: [authMiddleware] }, async (req) => {
    const user = req.user as any;
    const body = req.body as any;
    const project = await prisma.project.create({
      data: {
        teamId: body.teamId || 'default',
        categoryId: body.categoryId || null,
        projectName: body.projectName,
        brandName: body.brandName,
        productName: body.productName,
        industry: body.industry,
        description: body.description,
        createdBy: user.id,
      },
    });
    return project;
  });

  // Get project
  app.get('/projects/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { category: { select: { id: true, name: true, slug: true, icon: true } } },
    });
    return project;
  });

  // Archive project
  app.delete('/projects/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { id } = req.params as any;
    await prisma.project.update({ where: { id }, data: { status: 'archived', deletedAt: new Date() } });
    return { message: '项目已归档' };
  });
}
