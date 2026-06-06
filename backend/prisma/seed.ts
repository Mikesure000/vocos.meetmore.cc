import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ============================================================
  // Create Categories (三大品类)
  // ============================================================
  const categories = [
    {
      id: 'cat-beauty',
      name: '美妆护肤',
      slug: 'beauty',
      icon: '💄',
      description: '聚焦护肤品、彩妆、个护产品的评论分析与内容策略。用户决策依赖肤质、成分、效果、平替与安全感。',
      sortOrder: 1,
      knowledgeBase: JSON.stringify({
        dimensions: ['肤质', '成分', '功效', '敏感肌', '平替', '使用顺序', '功效边界', '刺激反馈', '价格价值感'],
        skinTypes: ['干性', '油性', '混合性', '敏感性', '中性'],
        commonIngredients: ['透明质酸', '烟酰胺', '视黄醇', '维C', '胜肽', '水杨酸', '神经酰胺'],
        keyConcerns: ['是否适合敏感肌', '会不会刺痛', '贵在哪里', '和XX比哪个好', '有效成分含量'],
      }),
      complianceRules: JSON.stringify([
        '不得承诺治疗效果',
        '不得使用"7天见效""永久去皱"等绝对化表达',
        '敏感肌声明需附测试报告',
        '防晒需标注SPF/PA值',
        '不得贬低竞品',
      ]),
      platformMethodology: JSON.stringify({
        douyin: {
          hooks: ['评论截图开头', '成分对比', '效果见证', '价格拆解'],
          structures: ['质疑回应型', '成分科普型', '真实体验型', '平替对比型'],
          minDuration: 15,
          maxDuration: 90,
        },
        xiaohongshu: {
          titles: ['成分党', '真实测评', '贵在哪里', '平替VS贵替'],
          keywords: ['敏感肌', '成分', '测评', '对比', '好物分享'],
          structures: ['清单型', '测评型', '避坑型', '对比型'],
        },
      }),
    },
    {
      id: 'cat-maternal',
      name: '母婴健康',
      slug: 'maternal',
      icon: '👶',
      description: '聚焦母婴用品、婴幼儿食品、儿童护理的评论分析与内容策略。用户极度关注安全、适龄、成分与真实案例。',
      sortOrder: 2,
      knowledgeBase: JSON.stringify({
        dimensions: ['适龄', '安全', '成分', '特殊人群', '真实案例', '使用边界', '过度承诺风险', '专业建议提示'],
        ageGroups: ['0-6月', '6-12月', '1-3岁', '3-6岁', '6-12岁', '孕期', '哺乳期'],
        keyConcerns: ['孩子能不能吃', '孕妇能不能用', '成分安全吗', '有没有真实案例', '适合几岁'],
        riskAreas: ['过敏风险', '吞咽风险', '皮肤刺激', '营养不均衡', '过度承诺功效'],
      }),
      complianceRules: JSON.stringify([
        '禁止疾病治疗暗示',
        '禁止替代药品声明',
        '婴幼儿食品不得暗示可替代母乳',
        '必须标注适用年龄范围',
        '不得使用医疗专业术语承诺功效',
        '过敏成分必须醒目标注',
        '不得使用"最安全""100%无害"等绝对化表达',
      ]),
      platformMethodology: JSON.stringify({
        douyin: {
          hooks: ['儿科医生建议型', '宝妈真实反馈', '成分安全拆解', '年龄段引导'],
          structures: ['安全科普型', '真实使用体验', '年龄段方案', '避坑指南型'],
          minDuration: 15,
          maxDuration: 90,
        },
        xiaohongshu: {
          titles: ['宝妈实测', '成分党妈妈', '儿科医生推荐', '避坑'],
          keywords: ['安全', '成分', '宝妈', '适龄', '测评', '真实体验'],
          structures: ['清单型', '对比型', '安全科普型', '年龄段推荐型'],
        },
      }),
    },
    {
      id: 'cat-functional-food',
      name: '功效食品',
      slug: 'functional-food',
      icon: '🍵',
      description: '聚焦功能性食品、保健品、膳食补充剂的评论分析与内容策略。用户关注功效周期、安全性、价格合理性。',
      sortOrder: 3,
      knowledgeBase: JSON.stringify({
        dimensions: ['功效表达边界', '成分含量', '使用周期', '见效预期', '特殊人群', '不能疾病治疗化', '不能替代药品', '案例不能泛化'],
        keyConcerns: ['真的有用吗', '多久见效', '是不是智商税', '贵在哪里', '有没有副作用'],
        riskAreas: ['夸大功效', '疾病治疗暗示', '虚假案例', '替代药品暗示', '特殊人群风险'],
      }),
      complianceRules: JSON.stringify([
        '禁止宣称疾病预防/治疗功能',
        '禁止替代药品声明',
        '必须标注"本品不能替代药品"',
        '不得使用医疗术语描述功效',
        '功效描述必须有科学文献支持',
        '不得暗示100%见效',
        '特殊人群(孕妇/儿童/老人)必须标注不适用声明',
        '案例不得泛化为普遍效果',
      ]),
      platformMethodology: JSON.stringify({
        douyin: {
          hooks: ['评论区质疑开头', '成分机制拆解', '真实用户反馈', '价格价值对比'],
          structures: ['质疑回应型', '科普机制型', '体验周期型', '价值拆解型'],
          minDuration: 15,
          maxDuration: 90,
        },
        xiaohongshu: {
          titles: ['吃了XX天', '成分分析', '贵在哪里', '真实体验'],
          keywords: ['成分', '功效', '周期', '测评', '对比', '避坑'],
          structures: ['周期体验型', '成分科普型', '对比测评型', '避坑指南型'],
        },
      }),
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
  }
  console.log('Categories seeded: 美妆护肤, 母婴健康, 功效食品');

  // Create default admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@vocosai.com' },
    update: {},
    create: {
      email: 'admin@vocosai.com',
      name: '系统管理员',
      passwordHash: adminPassword,
      role: 'super_admin',
    },
  });

  // Create demo user
  const demoPassword = await bcrypt.hash('demo123', 10);
  const demo = await prisma.user.upsert({
    where: { email: 'demo@vocosai.com' },
    update: {},
    create: {
      email: 'demo@vocosai.com',
      name: '演示用户',
      passwordHash: demoPassword,
      role: 'member',
    },
  });

  // Create default team
  const team = await prisma.team.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      teamName: '默认团队',
      ownerUserId: admin.id,
      planType: 'free',
      monthlyQuota: 1000000,
    },
  });

  // Add members to team
  await prisma.teamMember.upsert({
    where: { id: 'admin-member' },
    update: {},
    create: {
      id: 'admin-member',
      teamId: team.id,
      userId: admin.id,
      role: 'team_admin',
    },
  });

  await prisma.teamMember.upsert({
    where: { id: 'demo-member' },
    update: {},
    create: {
      id: 'demo-member',
      teamId: team.id,
      userId: demo.id,
      role: 'member',
    },
  });

  // Create demo project
  await prisma.project.upsert({
    where: { id: 'demo-project' },
    update: {},
    create: {
      id: 'demo-project',
      teamId: team.id,
      categoryId: 'cat-beauty',
      projectName: '示例项目 - 美妆品牌内容优化',
      brandName: '完美日记',
      productName: '小细跟口红',
      industry: '美妆护肤',
      description: '通过评论区分析优化抖音和小红书内容策略',
      createdBy: demo.id,
    },
  });

  // Create default model providers
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

  // Create model configs
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

  // Create AI Agents
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
    await prisma.aiAgent.upsert({
      where: { agentCode: agent.code },
      update: {},
      create: {
        agentCode: agent.code,
        agentName: agent.name,
        executionOrder: agent.order,
        canParallel: agent.parallel || false,
      },
    });
  }

  console.log('Seed completed!');
  console.log('Admin login: admin@vocosai.com / admin123');
  console.log('Demo login: demo@vocosai.com / demo123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
