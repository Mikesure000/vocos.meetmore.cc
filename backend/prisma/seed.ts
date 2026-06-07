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

  // Create demo brands
  if (await prisma.brand.count() === 0) {
    await prisma.brand.create({
      data: {
        teamId: team.id,
        name: '完美日记',
        industry: '美妆护肤',
        positioning: '新锐国货美妆品牌，主打高性价比和设计美学',
        tone: '年轻、时尚、自信',
        sellingPoints: JSON.stringify(['高显色', '持久不沾杯', '滋润丝滑', '国潮设计', '成分创新']),
        taboos: JSON.stringify(['贬低国货', '过度承诺效果', '医疗暗示']),
      },
    });
    await prisma.brand.create({
      data: {
        teamId: team.id,
        name: '花西子',
        industry: '美妆护肤',
        positioning: '东方美学高端彩妆品牌',
        tone: '优雅、文化自信、东方美',
        sellingPoints: JSON.stringify(['东方雕刻设计', '养肤配方', '高端质感', '文化IP']),
        taboos: JSON.stringify(['价格贬低', '西方风格对标', '过度承诺']),
      },
    });
    console.log('Brands seeded: 完美日记, 花西子');
  }

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

  // ============================================================
  // Demo 数据：完整任务 + 评论 + 分析结果
  // ============================================================

  if (await prisma.analysisTask.count({ where: { id: 'demo-task' } }) === 0) {
    const task = await prisma.analysisTask.create({
      data: {
        id: 'demo-task',
        teamId: team.id,
        projectId: 'demo-project',
        taskName: 'Demo - 完美日记小细跟口红评论分析',
        platform: 'douyin',
        contentUrl: 'https://www.douyin.com/video/7000000001',
        contentTitle: '几十块的口红和大牌到底差在哪？实测给你看',
        contentBody: '开头：拿出两支口红让大家猜哪个是大牌。中段：从显色度、持久度、滋润度三个维度对比。结尾：小细跟只要几十块，但效果真的不输大牌！',
        contentGoal: '转化成交',
        brandInfo: JSON.stringify({ brandName: '完美日记', productName: '小细跟口红', sellingPoints: '高显色、持久不沾杯、滋润丝滑' }),
        status: 'completed',
        createdBy: demo.id,
        startedAt: new Date('2026-06-06T10:00:00Z'),
        completedAt: new Date('2026-06-06T10:30:00Z'),
      },
    });

    // Demo 评论
    const demoComments = [
      { content: '这个和MAC的有什么区别？真的能平替吗？', signalLabels: ['competitor_comparison'], valueScore: 5, cleanStatus: 'valid' },
      { content: '好看！已经下单了', signalLabels: ['purchase_intent'], valueScore: 3, cleanStatus: 'valid' },
      { content: '几十块的东西能用吗？不太信', signalLabels: ['trust_gap'], valueScore: 4, cleanStatus: 'valid' },
      { content: '黄皮适合哪个色号啊？', signalLabels: ['audience_fit'], valueScore: 5, cleanStatus: 'valid' },
      { content: '用了两周，确实挺持久的，国货yyds', signalLabels: ['repurchase_signal'], valueScore: 3, cleanStatus: 'valid' },
      { content: '博主自己用过吗？感觉像广告', signalLabels: ['trust_gap'], valueScore: 4, cleanStatus: 'valid' },
      { content: '孕妇能用吗？成分安全不？', signalLabels: ['safety_concern'], valueScore: 5, cleanStatus: 'valid' },
      { content: '干皮用会不会拔干啊', signalLabels: ['audience_fit'], valueScore: 4, cleanStatus: 'valid' },
      { content: '好看好看好看！！！', signalLabels: [], valueScore: 1, cleanStatus: 'spam' },
      { content: '怎么买？在哪里买？求链接', signalLabels: ['purchase_intent'], valueScore: 4, cleanStatus: 'valid' },
      { content: '和花西子比呢？纠结中', signalLabels: ['competitor_comparison'], valueScore: 5, cleanStatus: 'valid' },
      { content: '加我微信 xxx 了解更多', signalLabels: ['dm_consult_signal'], valueScore: 1, cleanStatus: 'spam' },
      { content: '用了一个月没效果啊', signalLabels: ['effect_skepticism', 'negative_experience'], valueScore: 5, cleanStatus: 'valid' },
      { content: '约会涂这个够不够正式？', signalLabels: ['scenario_need'], valueScore: 3, cleanStatus: 'valid' },
      { content: '成分表能发一下吗？含酒精不', signalLabels: ['ingredient_focus'], valueScore: 4, cleanStatus: 'valid' },
      { content: '99块真不贵，我已经回购了', signalLabels: ['repurchase_signal'], valueScore: 3, cleanStatus: 'valid' },
      { content: '这个和几十块平替有什么区别？', signalLabels: ['price_objection', 'competitor_comparison'], valueScore: 5, cleanStatus: 'valid' },
      { content: '敏感肌能用吗？会不会过敏', signalLabels: ['safety_concern', 'audience_fit'], valueScore: 5, cleanStatus: 'valid' },
      { content: '第一次买国货口红，期待', signalLabels: ['purchase_intent'], valueScore: 3, cleanStatus: 'valid' },
      { content: '颜色真的好看！！', signalLabels: [], valueScore: 2, cleanStatus: 'valid' },
      { content: '怎么涂才不会掉色啊', signalLabels: ['usage_question'], valueScore: 4, cleanStatus: 'valid' },
      { content: '到底是买01还是03色号？纠结死了', signalLabels: ['purchase_intent'], valueScore: 3, cleanStatus: 'valid' },
    ];

    const commentRecords = [];
    for (const c of demoComments) {
      const record = await prisma.comment.create({
        data: {
          taskId: task.id,
          commentIdExternal: `demo_comment_${Math.random().toString(36).slice(2, 10)}`,
          commentText: c.content,
          signalLabels: JSON.stringify(c.signalLabels),
          valueScore: c.valueScore,
          cleanStatus: c.cleanStatus,
          sentiment: c.signalLabels.includes('negative_experience') ? 'negative' : c.signalLabels.includes('trust_gap') ? 'negative' : 'positive',
          userIdHash: `demo_user_${Math.random().toString(36).slice(2, 8)}`,
          createdAtExternal: new Date(Date.now() - Math.random() * 86400000 * 7),
        },
      });
      commentRecords.push(record);
    }
    console.log(`Seeded ${commentRecords.length} demo comments`);

    // 内容拆解结果
    await prisma.contentAnalysis.create({
      data: {
        taskId: task.id,
        analysisJson: JSON.stringify({
          taskInfo: { taskName: task.taskName, platform: 'douyin', contentGoal: '转化成交' },
          titleStructure: { hasPainPoint: true, hasKeyword: true, hasBenefit: true, hasConflict: true, score: 78, suggestion: '标题加入了价格冲突和大牌对比，有效吸引点击' },
          contentTheme: '产品测评对比型内容',
          hook: { type: '悬念对比型', effectiveness: 'high', comment: '开头用盲猜对比引发好奇，3秒内能抓住目标用户' },
          sellingPoints: [{ point: '高显色不输大牌', clarity: 'high', evidence: 'medium', comment: '对比展示清楚但缺少量化数据' }, { point: '持久不沾杯', clarity: 'high', evidence: 'high', comment: '有实测验证' }],
          platformFit: { douyin: { score: 82, issues: ['结尾CTA略弱', '缺少分色号推荐'] } },
        }),
      },
    });

    // 归因结果
    await prisma.attributionResult.create({
      data: {
        taskId: task.id,
        attributionJson: JSON.stringify({
          attributions: [
            { commentPhenomenon: '竞品比较评论占高价值评论32%', commentEvidence: ['和MAC区别？', '和花西子比呢？', '真的能平替吗？'], contentTrigger: '内容里未深入拆解差异化，只做了简单对比', attributionJudgment: '用户处于多品牌对比决策阶段，需要更细化的差异化说明', contentGap: '缺少分维度对比（显色度/持久度/成分）', nextAction: '制作竞品深度对比内容，3维度拆解' },
            { commentPhenomenon: '肤质适配问题出现频繁', commentEvidence: ['黄皮适合哪个色号', '干皮会不会拔干', '敏感肌能用吗'], contentTrigger: '内容未说明肤质和色号适配', attributionJudgment: '用户需要个性化妆容推荐', contentGap: '缺少分肤质/分色号指导', nextAction: '制作肤色分类选色指南' },
            { commentPhenomenon: '安全顾虑占比18%', commentEvidence: ['孕妇能用吗', '成分安全不', '会不会过敏'], contentTrigger: '内容未提及安全检测和成分信息', attributionJudgment: '用户对国产化妆品安全性仍有疑虑', contentGap: '缺少安全检测和成分说明', nextAction: '展示安全检测报告和成分解析' },
          ],
        }),
      },
    });

    // 3 张策略卡
    const strategyCards = [
      { priority: 'P0', title: '制作"平替大牌"深度对比视频', platform: 'douyin', cardJson: { contentOpportunity: '竞品比较类评论占高价值评论32%', commentEvidence: ['和MAC区别？', '和花西子比呢？'], userPainPoint: '在多个品牌间犹豫不决', coreJudgment: '需要系统对比内容帮助用户决策', suggestedPlatform: 'douyin', contentFormat: '对比测评', riskWarning: '客观评价竞品，不贬低', nextAction: '准备对比素材和实测数据' } },
      { priority: 'P1', title: '分肤色选色指南（图文)', platform: 'xiaohongshu', cardJson: { contentOpportunity: '肤质适配问题出现频繁，用户需要个性化推荐', commentEvidence: ['黄皮适合哪个色号', '干皮会不会拔干'], userPainPoint: '不确定适合自己的色号和肤质', coreJudgment: '分肤质/分肤色选色技巧可提升种草转化', suggestedPlatform: 'xiaohongshu', contentFormat: '图文教程+试色', riskWarning: '避免过度承诺适合所有肤色', nextAction: '拍摄6色号真人试色图' } },
      { priority: 'P2', title: '成分安全解析视频', platform: 'douyin', cardJson: { contentOpportunity: '18%用户对安全性有疑虑', commentEvidence: ['孕妇能用吗', '成分安全不'], userPainPoint: '对国产化妆品安全性存疑', coreJudgment: '成分科普可建立专业信任', suggestedPlatform: 'douyin', contentFormat: '科普型', riskWarning: '避免医疗暗示', nextAction: '准备成分分析资料' } },
    ];
    for (const sc of strategyCards) {
      await prisma.strategyCard.create({ data: { taskId: task.id, ...sc } });
    }

    // 抖音生产卡
    await prisma.productionCard.create({
      data: {
        taskId: task.id,
        platform: 'douyin',
        cardJson: JSON.stringify({
          contentGoal: '解决竞品比较犹豫，推动购买决策',
          titleOptions: ['几十块完美日记真的能平替MAC？实测对比来了', '评论区都在问和MAC区别在哪？这次讲清楚', '把完美日记和MAC放大100倍，差别到底在哪'],
          hook: '评论区都在问：它和MAC到底差在哪？',
          structure: ['展示评论质疑', '3维度实测对比', '放大镜细节', '总结适用人群', '引导评论投票'],
          materialNeeds: ['竞品对比图', '显微镜细节图', '持久度测试视频'],
          cta: '你觉得还需要对比哪个品牌？评论区告诉我',
          acceptanceCriteria: ['必须客观对比', '不能贬低竞品', '有量化数据', '明确适用人群'],
        }),
      },
    });

    // 小红书生产卡
    await prisma.productionCard.create({
      data: {
        taskId: task.id,
        platform: 'xiaohongshu',
        cardJson: JSON.stringify({
          contentGoal: '分肤色试色种草，提升收藏和购买转化',
          titleOptions: ['6色号真人试色，黄皮白皮全攻略', '完美日记小细跟6个色号到底怎么选？一篇讲清'],
          coverText: '黄皮vs白皮 6色号实测',
          coreKeywords: ['试色', '黄皮', '白皮', '平价口红', '国货测评'],
          bodyStructure: ['开头：自测肤色方法', '中段：6色号黄皮/白皮对比试色', '结尾：按场景推荐色号+收藏引导'],
          collectionPoints: ['肤色自测卡', '色号推荐表', '场景搭配方案'],
        }),
      },
    });

    // 需求地图
    await prisma.commentInsight.create({
      data: { taskId: task.id, insightType: 'demand', insightJson: JSON.stringify({
        demands: [
          { category: '竞品对比', frequency: 'high', intensity: 'strong', representativeComments: ['和MAC区别？', '和花西子比呢？', '真的能平替吗？'], insight: '用户在做多品牌对比决策，需要帮助消除信息不对称', suggestedContent: '深度对比视频，3维度拆解差异化' },
          { category: '肤质适配', frequency: 'high', intensity: 'strong', representativeComments: ['黄皮适合哪个色号', '干皮会不会拔干', '敏感肌能用吗'], insight: '用户需要个性化适用指导', suggestedContent: '分肤质/分肤色选色指南' },
          { category: '成分安全', frequency: 'medium', intensity: 'moderate', representativeComments: ['孕妇能用吗', '成分安全不', '会不会过敏'], insight: '国产化妆品仍需安全信任建设', suggestedContent: '成分科普+安全检测展示' },
          { category: '使用技巧', frequency: 'medium', intensity: 'moderate', representativeComments: ['怎么涂不掉色', '约会涂适合吗'], insight: '用户需要场景化使用技巧', suggestedContent: '场景使用教程' },
          { category: '持久度验证', frequency: 'low', intensity: 'moderate', representativeComments: ['能保持多久', '吃了饭会不会掉'], insight: '持久度是隐性决策因素', suggestedContent: '持久度实测记录' },
        ],
      })},
    });

    // 障碍地图
    await prisma.commentInsight.create({
      data: { taskId: task.id, insightType: 'barrier', insightJson: JSON.stringify({
        barriers: [
          { type: 'competitor', level: 'high', percentage: 32, evidence: ['和MAC区别？', '和花西子比呢？'], userPsychology: '竞品心智强，需要差异化说服', action: '深度对比+差异化定位', priority: 'P0' },
          { type: 'applicability', level: 'high', percentage: 25, evidence: ['黄皮适合哪个色号', '干皮会不会拔干'], userPsychology: '个性化适配焦虑', action: '分肤质选色指南', priority: 'P0' },
          { type: 'trust', level: 'medium', percentage: 18, evidence: ['博主自己用过吗', '感觉像广告'], userPsychology: '内容真实性存疑', action: '真实使用记录', priority: 'P1' },
          { type: 'safety', level: 'medium', percentage: 15, evidence: ['孕妇能用吗', '成分安全不'], userPsychology: '安全顾虑', action: '成分科普+检测报告', priority: 'P1' },
          { type: 'effect', level: 'low', percentage: 10, evidence: ['用了一个月没效果'], userPsychology: '效果预期偏差', action: '效果周期说明', priority: 'P2' },
        ],
      })},
    });

    // 投流评分
    await prisma.adFitScore.create({
      data: { taskId: task.id, score: 82, resultJson: JSON.stringify({
        score: 82, conclusion: '适合中等预算投放', dimensions: [
          { label: '人群清晰度', weight: 15, score: 13, comment: '目标明确:18-30岁精致女性' },
          { label: '卖点清晰度', weight: 15, score: 12, comment: '平替+性价比定位清晰' },
          { label: '购买理由', weight: 15, score: 11, comment: '价格对比有说服力' },
          { label: '评论风险', weight: 10, score: 7, comment: '存在竞品比较和信任质疑' },
          { label: '合规风险', weight: 15, score: 14, comment: '无明显违规' },
          { label: '素材稳定性', weight: 10, score: 9, comment: '不依赖热点，可长期素材' },
          { label: '可剪辑复用性', weight: 10, score: 8, comment: '可剪多版本适配不同人群' },
          { label: '转化承接', weight: 10, score: 8, comment: '可引导至直播间/商品页' },
        ],
        testVariables: [{ variant: 'A', name: '竞品对比型', description: '主打平替差异化' }, { variant: 'B', name: '实测体验型', description: '真人真实使用感受' }],
        targetAudience: '18-30岁一二线城市女性，关注美妆但预算有限',
      })},
    });

    // 评论区运营
    await prisma.commentOperationPlan.create({
      data: { taskId: task.id, planJson: JSON.stringify({
        pinned: ['想知道完美日记和MAC到底差在哪？下条视频3维度拆清楚！'],
        standardReplies: [
          { type: '竞品比较', template: '下个视频我们会从显色度、持久度、成分三个维度做详细对比！关注不迷路~' },
          { type: '选色疑问', template: '我们马上出分肤色的选色指南，先告诉小助理你是黄皮还是白皮？' },
          { type: '安全顾虑', template: '产品通过了SGS检测，具体成分表在商品详情页，也可以私信我们了解' },
        ],
        negativeReplies: [
          { scenario: '信任质疑', reply: '感谢关注！这是博主自费购买的实测，全程无广告，也欢迎你去店里亲自试色' },
          { scenario: '效果吐槽', reply: '抱歉没达到你的预期。每个人的唇色和试色效果不同，你涂的是什么色号？我帮你重新推荐' },
        ],
        highRisk: [{ signal: '竞品攻击', action: '保持专业不参与骂战，加强自有内容输出' }],
      })},
    });

    // 发布前质检
    await prisma.prePublishCheck.create({
      data: { taskId: task.id, totalScore: 82, status: 'completed', scriptContent: '待质检脚本内容...', checkJson: JSON.stringify({
        totalScore: 82, conclusion: '可以发布，建议优化CTA', items: [
          { label: '是否回应核心评论问题', passed: true, severity: 'pass', comment: '有效回应竞品比较需求' },
          { label: '标题是否有效', passed: true, severity: 'pass', comment: '标题有冲突+关键词' },
          { label: '开头是否有钩子', passed: true, severity: 'pass', comment: '3秒内引发好奇' },
          { label: '卖点是否清晰', passed: true, severity: 'pass', comment: '平替+性价比定位明确' },
          { label: '证明是否充分', passed: true, severity: 'pass', comment: '有实测数据' },
          { label: 'CTA 是否明确', passed: false, severity: 'optimize', comment: '结尾可引导"投票下一个想看的对比品牌"' },
          { label: '平台适配', passed: true, severity: 'pass', comment: '符合抖音内容规范' },
          { label: '合规风险', passed: true, severity: 'pass', comment: '无夸大/医疗暗示' },
          { label: '品牌调性', passed: true, severity: 'pass', comment: '亲和力+专业感平衡' },
        ],
      }), createdBy: demo.id },
    });

    console.log('Demo data seeded: 1 task, 22 comments, content analysis, attribution, 3 strategy cards, 2 production cards, demand/barrier maps, ad-fit, comment-ops, pre-publish check');
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
