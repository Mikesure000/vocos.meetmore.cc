/**
 * Auto-Initialization — 后端启动时自动创建必要数据
 * 
 * 原因：CloudRun 容器无状态，SQLite 数据库在容器重启后丢失。
 * 每次启动时自动检查并创建默认用户、团队、品类等基础数据。
 */
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

let initialized = false;

export async function autoInit(): Promise<void> {
  if (initialized) return;

  try {
    console.log('[AutoInit] Checking essential data...');

    // 1. Create admin user
    let adminUser = await prisma.user.findUnique({ where: { email: 'admin@vocosai.com' } });
    if (!adminUser) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@vocosai.com',
          name: '系统管理员',
          passwordHash: adminPassword,
          role: 'super_admin',
          status: 'active',
        },
      });
      console.log('[AutoInit] Admin user created');
    }

    // 2. Create demo user
    let demoUser = await prisma.user.findUnique({ where: { email: 'demo@vocosai.com' } });
    if (!demoUser) {
      const demoPassword = await bcrypt.hash('demo123', 10);
      demoUser = await prisma.user.create({
        data: {
          email: 'demo@vocosai.com',
          name: '演示用户',
          passwordHash: demoPassword,
          role: 'member',
          status: 'active',
        },
      });
      console.log('[AutoInit] Demo user created');
    } else if (demoUser.status === 'disabled') {
      // Fix disabled demo account
      demoUser = await prisma.user.update({
        where: { email: 'demo@vocosai.com' },
        data: { status: 'active' },
      });
      console.log('[AutoInit] Demo user re-activated');
    }

    // 3. Ensure demo password is correct (re-hash if needed via delete+recreate approach won't work with relations)
    // Instead, verify: if bcrypt compare fails, update password
    // We can't easily verify bcrypt here, so we just re-set it each restart
    // This ensures the password is always 'demo123'
    if (demoUser) {
      const demoPassword = await bcrypt.hash('demo123', 10);
      await prisma.user.update({
        where: { email: 'demo@vocosai.com' },
        data: { passwordHash: demoPassword },
      });
    }

    // 4. Create default team
    let team = await prisma.team.findUnique({ where: { id: 'default' } });
    if (!team) {
      team = await prisma.team.create({
        data: {
          id: 'default',
          teamName: '默认团队',
          ownerUserId: adminUser!.id,
          planType: 'free',
          monthlyQuota: 1000000,
        },
      });
      console.log('[AutoInit] Default team created');
    }

    // 5. Ensure admin is team member
    const adminMember = await prisma.teamMember.findUnique({ where: { id: 'admin-member' } });
    if (!adminMember) {
      await prisma.teamMember.create({
        data: {
          id: 'admin-member',
          teamId: team.id,
          userId: adminUser!.id,
          role: 'team_admin',
        },
      });
    }

    // 6. Ensure demo is team member
    const demoMember = await prisma.teamMember.findUnique({ where: { id: 'demo-member' } });
    if (!demoMember) {
      await prisma.teamMember.create({
        data: {
          id: 'demo-member',
          teamId: team.id,
          userId: demoUser!.id,
          role: 'member',
        },
      });
      console.log('[AutoInit] Demo user added to team');
    }

    // 7. Create categories
    const categoryDefs = [
      {
        slug: 'beauty', name: '美妆护肤', icon: '💄',
        description: '聚焦护肤品、彩妆、个护产品的评论分析与内容策略',
        sortOrder: 1,
        knowledgeBase: JSON.stringify({
          dimensions: ['肤质适配', '成分安全', '功效周期', '敏感肌适用', '平替对比'],
          skinTypes: { '干性': '紧绷起皮，需保湿锁水', '油性': '出油毛孔大，需控油清爽', '敏感性': '易泛红刺痛，无香精酒精' },
        }),
        complianceRules: JSON.stringify(['禁止承诺治疗效果', '禁止使用绝对化用语', '功效宣称需有检测报告支撑']),
        platformMethodology: JSON.stringify({}),
      },
      {
        slug: 'maternal', name: '母婴健康', icon: '👶',
        description: '聚焦母婴用品、婴幼儿食品、儿童护理的评论分析与内容策略',
        sortOrder: 2,
        knowledgeBase: JSON.stringify({ dimensions: ['适龄范围', '安全认证', '成分分析', '过敏风险'] }),
        complianceRules: JSON.stringify(['严禁疾病治疗暗示', '婴幼儿配方食品不得暗示可替代或优于母乳']),
        platformMethodology: JSON.stringify({}),
      },
      {
        slug: 'functional-food', name: '功效食品', icon: '🍵',
        description: '聚焦功能性食品、保健品、膳食补充剂的评论分析与内容策略',
        sortOrder: 3,
        knowledgeBase: JSON.stringify({ dimensions: ['功效边界', '成分含量', '见效周期', '科学依据'] }),
        complianceRules: JSON.stringify(['严禁宣称疾病预防/治疗/诊断功能', '必须标注"保健食品不是药品"']),
        platformMethodology: JSON.stringify({}),
      },
    ];

    for (const cat of categoryDefs) {
      const existing = await prisma.category.findUnique({ where: { slug: cat.slug } });
      if (!existing) {
        await prisma.category.create({
          data: { id: `cat-${cat.slug}`, ...cat },
        });
      }
    }
    console.log('[AutoInit] Categories ready');

    // 8. Create model providers
    await prisma.modelProvider.upsert({
      where: { id: 'provider-deepseek' },
      update: {},
      create: {
        id: 'provider-deepseek',
        providerName: 'deepseek',
        baseUrl: 'https://api.deepseek.com',
        apiKeyEncrypted: 'placeholder',
        status: 'active',
      },
    });

    await prisma.modelProvider.upsert({
      where: { id: 'provider-openai' },
      update: {},
      create: {
        id: 'provider-openai',
        providerName: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKeyEncrypted: 'placeholder',
        status: 'active',
      },
    });

    // 9. Create model configs
    await prisma.modelConfig.upsert({
      where: { id: 'model-deepseek-flash' },
      update: {},
      create: {
        id: 'model-deepseek-flash',
        providerId: 'provider-deepseek',
        modelName: 'deepseek-v4-flash',
        modelType: 'chat',
        contextWindow: 128000,
        inputTokenPrice: 0.002,
        outputTokenPrice: 0.004,
        isActive: true,
      },
    });

    await prisma.modelConfig.upsert({
      where: { id: 'model-deepseek-pro' },
      update: {},
      create: {
        id: 'model-deepseek-pro',
        providerId: 'provider-deepseek',
        modelName: 'deepseek-v4-pro',
        modelType: 'reasoning',
        contextWindow: 128000,
        inputTokenPrice: 0.004,
        outputTokenPrice: 0.008,
        isActive: true,
      },
    });
    console.log('[AutoInit] Model configs ready');

    // 10. Create AI agents
    const agentDefs = [
      { code: 'agent-00', name: '任务理解与目标识别', order: 0 },
      { code: 'agent-01', name: '原内容拆解', order: 1, parallel: true },
      { code: 'agent-02', name: '评论去重清洗', order: 2, parallel: true },
      { code: 'agent-03', name: '水军与无效评论过滤', order: 3 },
      { code: 'agent-04', name: '多轮对话清洗', order: 4 },
      { code: 'agent-05', name: '情感深度分析', order: 5, parallel: true },
      { code: 'agent-06', name: '高价值评论筛选', order: 6, parallel: true },
      { code: 'agent-07', name: '用户需求与购买障碍识别', order: 7 },
      { code: 'agent-08', name: '内容-评论归因', order: 8 },
      { code: 'agent-09', name: '内容价值类型识别', order: 9 },
      { code: 'agent-10', name: '平台策略生成', order: 10 },
      { code: 'agent-11', name: '内容生产卡生成', order: 11, parallel: true },
      { code: 'agent-12', name: '评论区运营', order: 12, parallel: true },
      { code: 'agent-13', name: '投流适配评分', order: 13 },
      { code: 'agent-14', name: '发布前质检', order: 14 },
      { code: 'agent-15', name: '报告组装', order: 15 },
      { code: 'agent-16', name: 'AI 质量评估', order: 16 },
    ];

    for (const agent of agentDefs) {
      const existing = await prisma.aiAgent.findUnique({ where: { agentCode: agent.code } });
      if (!existing) {
        await prisma.aiAgent.create({
          data: {
            agentCode: agent.code,
            agentName: agent.name,
            executionOrder: agent.order,
            canParallel: agent.parallel || false,
          },
        });
      }
    }
    console.log('[AutoInit] AI agents ready');

    initialized = true;
    console.log('[AutoInit] ✅ All essential data initialized');
    console.log('[AutoInit] Demo login: demo@vocosai.com / demo123');
    console.log('[AutoInit] Admin login: admin@vocosai.com / admin123');
  } catch (err) {
    console.error('[AutoInit] ❌ Initialization failed:', err);
    // Don't crash the server on init failure; it may already have data
  }
}
