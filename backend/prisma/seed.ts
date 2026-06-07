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
        dimensions: ['肤质适配', '成分安全', '功效周期', '敏感肌适用', '平替对比', '使用顺序', '刺激反馈', '价格价值感', '包装设计', '气味/肤感'],
        skinTypes: {
          '干性': '紧绷起皮，需保湿锁水，避开酒精类',
          '油性': '出油毛孔大，需控油清爽，含水杨酸',
          '混合性': 'T区油两颊干，分区护理',
          '敏感性': '易泛红刺痛，无香精酒精，含神经酰胺',
          '中性': '水油平衡，基础保湿即可',
        },
        commonIngredients: {
          '保湿类': ['透明质酸', '甘油', '神经酰胺', '角鲨烷', '泛醇(B5)'],
          '美白类': ['烟酰胺', '维C/VC衍生物', '熊果苷', '传明酸', '377(苯乙基间苯二酚)'],
          '抗老类': ['视黄醇(A醇)', '胜肽', '玻色因', '二裂酵母', '艾地苯'],
          '祛痘类': ['水杨酸', '壬二酸', '茶树精油', '过氧化苯甲酰', '维A酸'],
          '舒缓类': ['积雪草', '马齿苋', '红没药醇', '甘草酸二钾', '尿囊素'],
        },
        keyConcerns: ['敏感肌能不能用', '会不会刺痛/过敏', '贵在哪里值不值', '和XX比哪个好', '有效成分含量多少', '多久能看到效果', '需要搭配什么用', '孕妇能不能用'],
        contentStrategies: {
          '价格异议': '拆解成分成本+研发投入+效果数据，避免仅说"品质好"',
          '效果追问': '展示28天使用记录+素颜对比+周期变化，数据比说法有力',
          '肤质疑问': '分肤质教程+肤质自测工具+真人各肤质反馈',
          '成分关注': '成分科普+浓度说明+搭配禁忌+真人体验',
          '竞品对比': '客观3维度对比(成分/体验/价格)，不贬低竞品',
        },
        responseGuidelines: {
          '过敏反馈': '先道歉→建议停用→了解具体情况→推荐替代方案',
          '效果差评': '感谢反馈→解释个体差异→提供使用建议→邀请继续观察',
          '价格吐槽': '理解感受→价值拆解→引导关注性价比→预告折扣',
        },
      }),
      complianceRules: JSON.stringify([
        '禁止承诺治疗效果(祛痘/祛斑/抗敏等属医疗范畴)',
        '禁止使用绝对化用语: 7天见效/永久去皱/100%有效/最好/第一',
        '敏感肌/医美后适用声明需附皮肤科测试报告',
        '防晒产品必须标注SPF值且≤50+、PA值≤++++',
        '不得贬低竞品: "XX品牌全靠营销""那个牌子烂脸"',
        '功效宣称需有检测报告支撑(保湿/美白/抗皱等)',
        '不得使用"药妆""医学护肤品"等暗示医疗属性词汇',
        '成分宣称需与备案一致，不得夸大浓度',
        '儿童化妆品需符合《儿童化妆品监督管理规定》',
        '不得虚假宣称"XX明星同款""XX医生推荐"',
      ]),
      platformMethodology: JSON.stringify({
        douyin: {
          hooks: ['评论截图+大字质疑', '成分对比实验', '28天效果见证', '价格拆解:1瓶=XX次美容院', '素颜真实对比', '放大镜看成分'],
          structures: ['质疑回应型(3秒钩子→回应→证据→总结)', '成分科普型(提出问题→成分解析→效果说明→适合人群)', '真实体验型(素颜→使用→对比→感受)', '平替测评型(外观→成分→实测→结论)'],
          ctaPatterns: ['评论区投票下一个想看的对比', '你觉得最需要改善的是什么？', '这个价格你愿意试试吗？'],
          minDuration: 15, maxDuration: 90, optimalDuration: 45,
        },
        xiaohongshu: {
          titles: ['成分党必看', '28天真实记录', '贵但值得?拆解给你看', '平替能不能替?实测对比', '皮肤科建议的护肤顺序', '学生党/上班族护肤方案'],
          keywords: ['敏感肌', '成分解析', '真实测评', '平价替代', '护肤routine', '好物分享', '空瓶记', '回购清单'],
          structures: ['清单型(分类推荐+适用说明)', '测评型(多维对比+量化评分)', '避坑型(反面教材+正确方案)', '教程型(步骤详解+注意事项)'],
          interactionDesign: '引导收藏("收藏起来慢慢看") + 提问互动("你是什么肤质?")',
        },
      }),
    },
    {
      id: 'cat-maternal',
      name: '母婴健康',
      slug: 'maternal',
      icon: '👶',
      description: '聚焦母婴用品、婴幼儿食品、儿童护理的评论分析与内容策略。用户极度关注安全、适龄、成分与真实案例，决策周期长、信息验证行为多。',
      sortOrder: 2,
      knowledgeBase: JSON.stringify({
        dimensions: ['适龄范围', '安全认证', '成分分析', '过敏风险', '真实案例', '使用便捷性', '性价比', '品牌信誉', '售后保障'],
        ageGroups: {
          '新生儿(0-1月)': '纯棉A类/无荧光剂/无骨缝制/奶瓶材质',
          '婴儿(1-12月)': '口欲期安全/辅食添加/大运动发展/疫苗期护理',
          '幼儿(1-3岁)': '如厕训练/语言启蒙/社交发展/精细动作',
          '学龄前(3-6岁)': '学习工具/兴趣培养/社交能力/营养均衡',
          '孕期': '叶酸/DHA/防辐射/妊娠纹/待产包',
          '哺乳期': '催乳/回奶/乳头霜/哺乳内衣/储奶袋',
          '产后恢复': '盆底肌/腹直肌/产后脱发/身材恢复',
        },
        safetyCertifications: ['国标GB/企标Q', 'A类婴幼儿标准', 'FDA认证', '欧盟CE', 'SGS检测', '皮肤刺激性测试', '无荧光剂检测'],
        keyConcerns: ['适合多大宝宝', '成分安全吗有认证吗', '会不会过敏/红屁股', '有没有真实宝妈用过', '材质是什么A类吗', '好清洗吗方便吗', '价格合理吗性价比怎样', '售后有保障吗'],
        contentStrategies: {
          '安全焦虑': '展示检测报告+SGS证书+成分解析，用权威证据消除顾虑',
          '适龄疑问': '分月龄/年龄段详细说明+过渡信号识别+不同阶段注意事项',
          '使用困惑': '实操视频+步骤拆解+常见错误示范+技巧分享',
          '竞品对比': '安全性/材质/设计/价格4维度对比，强调差异化',
          '价格敏感': '使用周期计算(日均成本)+品质对比+长期价值说明',
        },
        commonMistakes: ['过量喂养', '过早添加调味料', '过度包裹', '忽视口腔清洁', '奶瓶不消毒', '使用学步车', '过早把尿'],
        seasonalTopics: {
          '春季': '花粉过敏防护/春捂秋冻/户外活动装备',
          '夏季': '防晒驱蚊/痱子护理/空调使用/游泳安全',
          '秋季': '秋季腹泻/流感疫苗/入园适应/干燥保湿',
          '冬季': '保暖防冻/加湿器使用/室内活动/儿童感冒',
        },
      }),
      complianceRules: JSON.stringify([
        '严禁疾病治疗暗示: 不得宣称产品可治疗/预防任何疾病',
        '严禁替代药品声明: 不得使用"不用去医院""不用吃药"等表述',
        '婴幼儿配方食品不得暗示可替代或优于母乳',
        '必须标注适用月龄/年龄范围，不得使用"全年龄段通用"',
        '不得使用医疗专业术语承诺功效: "消炎""杀菌""治疗"',
        '过敏成分必须在内容中醒目标注(大字/高亮)',
        '不得使用绝对化表达: "最安全""100%无害""零风险"',
        '不得发布未满6月龄婴儿配方食品广告',
        '涉及儿童的场景必须获得监护人同意(出镜需打码或授权)',
        '不得制造育儿焦虑: "别人家孩子都""错过了就晚了"',
        '不得推荐未备案的"海淘""代购"婴幼儿食品',
        '食品安全需标注生产日期/保质期/储存条件',
      ]),
      platformMethodology: JSON.stringify({
        douyin: {
          hooks: ['宝妈真实困惑(引发共鸣)', '儿科医生讲解(权威背书)', '安全检测揭秘(信息差)', '使用前后对比(效果直观)', '带娃神器实测(实用主义)'],
          structures: ['痛点共鸣型(妈妈焦虑→解决方案→产品展示→反馈)', '权威科普型(医学原理→日常应用→产品推荐→注意事项)', '开箱实测型(外观→材质→使用→清洗→总结)', '年龄段方案(新生儿期→婴儿期→幼儿期分段讲解)'],
          ctaPatterns: ['你家宝宝多大？评论区告诉我', '还有什么育儿困惑？', '转发给需要的宝妈'],
          minDuration: 30, maxDuration: 120, optimalDuration: 60,
        },
        xiaohongshu: {
          titles: ['宝妈亲测', '新生儿必备清单', '踩过的坑不要再踩', '儿科医生偷偷告诉你', '不同月龄怎么选', '待产包终极攻略'],
          keywords: ['安全', 'A类', '无荧光剂', '宝妈', '婴儿', '新生儿', '月子', '入园', '实拍', '测评'],
          structures: ['清单型(分类推荐+年龄段标注)', '对比型(多品牌横向对比+评分)', '避坑型(买了后悔系列+正确选择)', '攻略型(从备孕到入园完整时间线)'],
          interactionDesign: '引导收藏("待产妈妈先收藏") + 年龄段互动("你家娃多大了?")',
        },
      }),
    },
    {
      id: 'cat-functional-food',
      name: '功效食品',
      slug: 'functional-food',
      icon: '🍵',
      description: '聚焦功能性食品、保健品、膳食补充剂的评论分析与内容策略。用户关注功效周期、安全性、价格合理性，高度在意"是不是智商税"。',
      sortOrder: 3,
      knowledgeBase: JSON.stringify({
        dimensions: ['功效边界', '成分含量', '见效周期', '科学依据', '安全性', '适用人群', '禁忌人群', '性价比', '使用便利性'],
        categories: {
          '维生素矿物质': ['复合维生素', '维生素C/D/B族', '钙铁锌硒', '适合日常补充，效果温和',
            '需注意: 脂溶性维生素(A/D/E/K)不可过量'],
          '益生菌/酵素': ['益生菌(需看菌株号+活菌数)', '益生元', '消化酶',
            '需注意: 益生菌不耐高温/胃酸，需包埋技术'],
          '蛋白/氨基酸': ['乳清蛋白', '大豆蛋白', '胶原蛋白肽', '支链氨基酸BCAA',
            '需注意: 肾功异常慎用，需配合运动'],
          '草本/植物提取': ['灵芝孢子粉', '人参皂苷', '姜黄素', '奶蓟草', '绿茶提取物',
            '需注意: 药物相互作用风险高，需标注'],
          '功能性油脂': ['鱼油(DHA/EPA)', '磷虾油', '椰子油/MCT', '共轭亚油酸CLA',
            '需注意: 鱼油易氧化，需看TOTOX值'],
          '代餐/轻食': ['代餐奶昔', '蛋白棒', '低GI食品',
            '需注意: 不能完全替代正餐，需标注营养配比'],
        },
        keyConcerns: ['真的有效吗有科学依据吗', '多久能看到效果', '是不是智商税', '有副作用吗伤肝肾吗', '适合我吃吗', '怎么吃效果最好', '能长期吃吗', '和药一起吃有冲突吗'],
        contentStrategies: {
          '功效怀疑': '展示临床研究数据+文献引用+真人周期反馈，避免空谈"有效"',
          '安全担忧': '成分来源+生产工艺+检测报告+剂量上限说明',
          '价格质疑': '成分成本拆解+每日成本计算+与同类产品对比+品质差异说明',
          '周期疑问': '明确说明不同阶段预期+影响因素+个体差异+坚持建议',
          '智商税指控': '科学原理讲解+行业标准对比+真实案例+理性消费引导',
        },
        efficacyCycle: {
          '1-2周': '体感变化(精神状态/睡眠/消化)，非功效核心指标',
          '4-8周': '初期效果显现(指标变化/症状改善)，需持续使用',
          '3-6月': '稳定效果期，可评估是否继续',
          '6月+': '长期维持/调理，建议周期性使用',
        },
        forbiddenClaims: ['替代药品', '治疗疾病', '100%见效', '无任何副作用', '适合所有人', '立竿见影'],
      }),
      complianceRules: JSON.stringify([
        '严禁宣称疾病预防/治疗/诊断功能(属药品/医疗器械范畴)',
        '严禁替代药品声明: 不得暗示可替代任何处方药或治疗手段',
        '必须标注"保健食品不是药品，不能替代药品治疗疾病"',
        '不得使用医疗术语: 疗效/治愈/疗程/处方/临床验证',
        '功效描述必须有科学文献/检测报告支撑，不得夸大',
        '不得暗示100%见效或适合所有人群',
        '特殊人群(孕妇/哺乳期/儿童/老人/肝肾疾病患者)必须标注不适用声明',
        '益生菌需标注菌株号(如Lactobacillus rhamnosus GG)',
        '进口产品需有中文标签，标注原产国/境内责任人',
        '不得暗示食用该产品可不看医生/不体检',
        '案例展示不得泛化为普遍效果，需标注"个体效果因人而异"',
        '不得使用"最""第一""唯一"等绝对化表述',
        '蛋白质含量宣称≤10g/100g不得称"高蛋白"',
        '涉及体重管理不得暗示"无需运动/无需节食"',
      ]),
      platformMethodology: JSON.stringify({
        douyin: {
          hooks: ['评论质疑直接回应(信息差破局)', '成分机制动画讲解(可视化)', '真实用户周期反馈(可信度)', '成本拆解对比(性价比)'],
          structures: ['质疑回应型(网友质疑→科学原理→证据展示→理性建议)', '科普机制型(问题→原理→成分→产品→注意事项)', '周期体验型(第1天→第4周→第12周，阶段记录)', '对比测评型(成分/含量/价格/口碑四维对比)'],
          ctaPatterns: ['你吃过类似产品吗？评论区分享经验', '下一个想了解什么成分？', '转发给总说保健品是智商税的朋友'],
          minDuration: 30, maxDuration: 120, optimalDuration: 60,
        },
        xiaohongshu: {
          titles: ['吃了3个月真实反馈', '成分分析:它到底有没有用', '避坑!这几类人千万别吃', '每天花X元的真相', '对比了XX个品牌选出的', '营养师的建议:先搞清楚再买'],
          keywords: ['成分解析', '周期记录', '真实体验', '理性消费', '避坑指南', '测评对比', '科学依据', '长期反馈'],
          structures: ['成分科普型(是什么→为什么有效→怎么选→适合谁)', '周期记录型(每周记录→变化对比→最终结论)', '横评对比型(品牌对比→成分对比→价格对比→推荐)', '避坑指南型(不能吃的X种人→正确用法→选购技巧)'],
          interactionDesign: '引导收藏("先收藏慢慢看") + 人群互动("你有类似困扰吗?")',
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
