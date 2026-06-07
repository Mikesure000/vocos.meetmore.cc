/**
 * 品牌管理 API
 */
import type { FastifyInstance } from 'fastify';
import { prisma } from '../../config/prisma.js';
import { authMiddleware } from '../../middleware/auth.js';

export async function brandRoutes(app: FastifyInstance) {
  // 品牌列表
  app.get('/brands', { preHandler: [authMiddleware] }, async () => {
    return prisma.brand.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { products: true } } },
    });
  });

  // 创建品牌
  app.post('/brands', { preHandler: [authMiddleware] }, async (req) => {
    const body = req.body as any;
    return prisma.brand.create({
      data: {
        teamId: body.teamId || 'default',
        name: body.name,
        industry: body.industry,
        positioning: body.positioning,
        tone: body.tone,
        sellingPoints: body.sellingPoints ? JSON.stringify(body.sellingPoints) : null,
        taboos: body.taboos ? JSON.stringify(body.taboos) : null,
      },
    });
  });

  // 品牌详情 + 产品
  app.get('/brands/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    const [brand, products] = await Promise.all([
      prisma.brand.findUnique({ where: { id } }),
      prisma.brandProduct.findMany({ where: { brandId: id }, orderBy: { createdAt: 'desc' } }),
    ]);
    if (!brand) return null;
    return { ...brand, products };
  });

  // 更新品牌
  app.put('/brands/:id', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    const body = req.body as any;
    const data: any = {};
    if (body.name) data.name = body.name;
    if (body.industry) data.industry = body.industry;
    if (body.positioning !== undefined) data.positioning = body.positioning;
    if (body.tone !== undefined) data.tone = body.tone;
    if (body.sellingPoints) data.sellingPoints = JSON.stringify(body.sellingPoints);
    if (body.taboos) data.taboos = JSON.stringify(body.taboos);
    return prisma.brand.update({ where: { id }, data });
  });

  // 删除品牌
  app.delete('/brands/:id', { preHandler: [authMiddleware] }, async () => {
    const { id } = req.params as any;
    await prisma.brand.update({ where: { id }, data: { status: 'archived' } });
    return { message: '品牌已归档' };
  });

  // 产品 CRUD
  app.post('/brands/:id/products', { preHandler: [authMiddleware] }, async (req) => {
    const { id } = req.params as any;
    const body = req.body as any;
    return prisma.brandProduct.create({
      data: { brandId: id, name: body.name, description: body.description, category: body.category, priceRange: body.priceRange },
    });
  });

  app.put('/brands/:id/products/:productId', { preHandler: [authMiddleware] }, async (req) => {
    const { productId } = req.params as any;
    const body = req.body as any;
    return prisma.brandProduct.update({ where: { id: productId }, data: body });
  });

  app.delete('/brands/:id/products/:productId', { preHandler: [authMiddleware] }, async () => {
    const { productId } = req.params as any;
    await prisma.brandProduct.delete({ where: { id: productId } });
    return { message: '产品已删除' };
  });
}
