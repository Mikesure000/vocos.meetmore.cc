import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { authMiddleware } from '../../middleware/auth.js';

export async function teamRoutes(app: FastifyInstance) {
  app.get('/teams', { preHandler: [authMiddleware] }, async (req) => {
    const user = req.user as any;
    const memberships = await prisma.teamMember.findMany({
      where: { userId: user.id },
      include: { team: true },
    });
    return memberships.map((m) => ({ ...m.team, myRole: m.role }));
  });

  app.post('/teams', { preHandler: [authMiddleware] }, async (req) => {
    const user = req.user as any;
    const body = req.body as any;
    const team = await prisma.team.create({
      data: { teamName: body.teamName, ownerUserId: user.id },
    });
    await prisma.teamMember.create({
      data: { teamId: team.id, userId: user.id, role: 'team_admin' },
    });
    return team;
  });

  app.get('/teams/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    const team = await prisma.team.findUnique({ where: { id } });
    const members = await prisma.teamMember.findMany({
      where: { teamId: id },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
    return { ...team, members };
  });

  app.post('/teams/:id/members', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    const { email, role } = req.body as any;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: '用户不存在' };
    return prisma.teamMember.create({ data: { teamId: id, userId: user.id, role: role || 'member' } });
  });

  // ============ 白标配置 ============
  app.get('/teams/:id/white-label', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    const team = await prisma.team.findUnique({ where: { id }, select: { whiteLabelConfig: true } });
    return team?.whiteLabelConfig ? JSON.parse(team.whiteLabelConfig) : {};
  });

  app.put('/teams/:id/white-label', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    const body = req.body as any;
    const config = {
      companyName: body.companyName || 'VocosAI',
      logo: body.logo || '',
      primaryColor: body.primaryColor || '#16a34a',
      hideVocosBrand: body.hideVocosBrand || false,
    };
    await prisma.team.update({ where: { id }, data: { whiteLabelConfig: JSON.stringify(config) } });
    return { message: '白标配置已更新', config };
  });
}
