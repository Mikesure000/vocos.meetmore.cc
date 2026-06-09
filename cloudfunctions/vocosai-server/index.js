// ═══════════════════════════════════
// VocosAI Server — Cloud Function (MySQL)
// ═══════════════════════════════════
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const JWT_SECRET = process.env.JWT_SECRET || 'vocosai-prod-2026-secure';
const DB_URL = process.env.DATABASE_URL || '';

// ─── MySQL Connection Pool ───
let pool = null;
function getPool() {
  if (pool) return pool;
  if (!DB_URL) {
    console.warn('[DB] No DATABASE_URL, using fallback');
    return null;
  }
  pool = mysql.createPool({
    uri: DB_URL,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
  });
  return pool;
}

async function query(sql, params = []) {
  const p = getPool();
  if (!p) return [];
  try {
    const [rows] = await p.execute(sql, params);
    return rows;
  } catch (err) {
    console.error('[DB] Query error:', err.message);
    return [];
  }
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows[0] || null;
}

async function run(sql, params = []) {
  const p = getPool();
  if (!p) return;
  try {
    await p.execute(sql, params);
  } catch (err) {
    console.error('[DB] Run error:', err.message);
  }
}

// ─── Category knowledge base seed data ───
const CATEGORY_SEED = {
  beauty: {
    knowledgeBase: JSON.stringify({
      dimensions: ['肤质分析', '成分拆解', '功效评估', '平替对比', '敏感肌适配', '使用场景'],
      keyConcerns: ['成分安全', '真实效果', '适用肤质', '性价比', '使用手法', '季节适配'],
      skinTypes: { 干皮: '保湿、滋润、封闭性强', 油皮: '清爽、控油、不致痘', 混合皮: '分区护理、T控U润', 敏感肌: '温和、无酒精、修护屏障' },
      ingredientWatch: { 功效成分: ['烟酰胺', '视黄醇', '透明质酸', '神经酰胺', '维C衍生物'], 避雷成分: ['酒精', '香精', '尼泊金酯', 'SLS'] },
      contentStrategies: { 拆解型: '深入拆解成分表，解释每个成分的作用和浓度', 对比型: '同价位/同功效产品横评，给用户选择依据', 教程型: '正确的使用手法、用量和搭配顺序', 避坑型: '常见误区、智商税成分、营销话术拆解' },
      commonMistakes: ['过度护肤导致屏障受损', '跟风购买不适配肤质产品', '忽视防晒', '成分冲突叠加'],
      responseGuidelines: { 质疑效果: '用成分原理+使用周期解释，避免绝对化承诺', 询问搭配: '考虑成分相互作用，给出分时段建议', 敏感肌: '优先推荐修护类，强调建立耐受' },
    }),
    complianceRules: JSON.stringify([
      '禁止使用"最""第一"等绝对化用语',
      '禁止暗示医疗效果（如"治疗""治愈"）',
      '功效宣称需有人体功效评价报告支持',
      '防晒类必须有SPF/PA值标注',
      '特殊用途化妆品（美白、防晒、防脱）需特证',
      '禁止使用"药妆""医学护肤"等医疗暗示词',
      '成分宣称需与产品配方一致',
    ]),
    platformMethodology: JSON.stringify({
      douyin: { hooks: ['用了两周，说说真实感受', '这个成分千万别乱用', '干货来了！教你3秒看懂成分表', '谁还在踩这个坑？'], structures: ['痛点钩子→成分拆解→使用建议→避坑提醒', '对比开场→逐项分析→最终结论', '问题抛出→原理讲解→解决方案'], ctaPatterns: ['评论区告诉我你的肤质', '主页看更多成分拆解', '双击收藏下次买前看'], optimalDuration: '30-60秒' },
      xiaohongshu: { titles: ['成分党必看！XXX真实测评', '平替还是智商税？一次说清', '敏感肌亲测！XXX使用28天', '护肤小白必读：看懂这5个成分就够了'], keywords: ['成分分析', '真实测评', '平替', '肤质适配', '避坑'], structures: ['标题+首图(效果对比)→成分拆解→使用感受→总结推荐', '问题引入→产品分析→适用人群→注意事项'], interactionDesign: '评论区引导肤质匹配，笔记结尾设置投票互动' },
    }),
  },
  maternal: {
    knowledgeBase: JSON.stringify({
      dimensions: ['安全评估', '适龄推荐', '成分审核', '真实案例', '合规检测', '特殊人群'],
      keyConcerns: ['成分安全', '年龄适配', '过敏风险', '营养均衡', '品牌可信度', '使用方法'],
      ageGroups: { '0-6月': '仅限基础护理，无添加', '6-12月': '温和清洁为主，注意保湿', '1-3岁': '功能细分，注意防吞咽', '3-6岁': '可引入更多功能产品', '孕期': '避雷维A酸类、水杨酸高浓度' },
      safetyChecklist: { 禁用成分: ['尼泊金酯类', '释放甲醛防腐剂', 'SLS/SLES', '人工香精'], 安全认证: ['GB/T认证', 'ECARF过敏认证', 'OEKO-TEX'] },
      contentStrategies: { 安全型: '从成分表入手，逐项说明安全性', 经验型: '真实使用体验+阶段性效果', 科普型: '婴幼儿皮肤特点与护理要点', 对比型: '同品类产品安全评级对比' },
      commonMistakes: ['成人产品给婴幼儿用', '忽视产品保质期和开封后使用期', '跟风购买不适合年龄段产品'],
      responseGuidelines: { 安全担忧: '提供成分分析+认证信息，引用权威来源', 年龄疑问: '明确标注适用年龄段和注意事项', 敏感问题: '建议咨询儿科医生，不做诊断性建议' },
      seasonalTopics: { 春季: '花粉过敏防护、保湿', 夏季: '防晒、痱子护理、驱蚊', 秋季: '皮肤干燥预防、换季护理', 冬季: '防冻保湿、室内加湿' },
    }),
    complianceRules: JSON.stringify([
      '婴幼儿产品必须标注适用年龄',
      '禁止使用"最安全""零风险"等绝对化用语',
      '母婴食品需符合GB 10765/10767/10769标准',
      '禁止暗示可替代母乳',
      '婴幼儿化妆品需标注"应在成人监护下使用"',
      '禁止使用医疗暗示用语',
      '营养品需标注"不能替代药物和正常膳食"',
    ]),
    platformMethodology: JSON.stringify({
      douyin: { hooks: ['当妈后才知道的坑', '儿科医生都推荐的', '亲测有用！宝宝再也不', '这个居然不能给宝宝用？'], structures: ['痛点场景→安全分析→正确做法→避坑总结', '日常vlog→产品植入→使用展示→效果反馈', '问题引入→专家观点→实操演示'], ctaPatterns: ['新手妈妈必收藏', '评论区说说你家宝宝多大了', '关注看更多育儿干货'], optimalDuration: '30-90秒' },
      xiaohongshu: { titles: ['新手妈妈必看！XXX安全评测', '儿科医生推荐的安全好物', '亲测！6个月宝宝用了XX天', '避坑！这些成分千万别给宝宝用'], keywords: ['安全', '婴幼儿', '无添加', '儿科推荐', '亲测'], structures: ['问题引入→成分/安全分析→适用年龄→使用建议', '开箱展示→使用过程→效果记录→总结'], interactionDesign: '评论区按宝宝年龄段分组讨论' },
    }),
  },
  'functional-food': {
    knowledgeBase: JSON.stringify({
      dimensions: ['功效边界', '周期验证', '成分含量', '合规审查', '价值拆解', '人群适配'],
      keyConcerns: ['真实功效', '有效剂量', '合规宣传', '适用人群', '使用周期', '性价比'],
      efficacyCycle: { '1-2周': '体感初期，部分用户可能感受到睡眠/精力变化', '1个月': '水溶性营养素指标改善，主观感受增强', '3个月': '脂溶性营养素/骨骼类指标可能改善', '6个月': '多数功效成分达到稳态，可做客观评估' },
      ingredientStandards: { '中国标准': 'GB 16740-2014 保健食品', '功能声称': '需经审批的27种保健功能', '剂量参考': '参考《中国居民膳食营养素参考摄入量》' },
      contentStrategies: { 科普型: '从科学角度解释成分作用机制和有效剂量', 体验型: '真实记录使用过程和身体变化', 对比型: '同类产品成分/含量/性价比横向对比', 避坑型: '智商税成分拆解、夸大宣传话术识别' },
      commonMistakes: ['期望速效，忽视周期', '超量服用，忽视耐受性', '混淆食品和药品功效', '忽视与药物的相互作用'],
      responseGuidelines: { 效果疑问: '说明起效周期+个体差异，避免绝对承诺', 剂量问题: '参照推荐摄入量，提醒不超过可耐受最高量', 搭配疑问: '注意成分间相互作用，建议错开服用时间' },
    }),
    complianceRules: JSON.stringify([
      '禁止使用"治疗""治愈""药效"等医疗用语',
      '保健食品不能替代药物',
      '功效宣称限于审批的27种保健功能',
      '必须标注"本品不能替代药物"',
      '禁止使用"最""第一""100%"等绝对化用语',
      '成分含量标注需与实际检测一致',
      '进口食品需标注中文标签和进口许可',
    ]),
    platformMethodology: JSON.stringify({
      douyin: { hooks: ['吃了3个月，体检报告说话', '营养师说这个成分真的有用', '别再交智商税了！', '这个剂量才有效，你吃对了吗？'], structures: ['痛点引入→成分分析→有效剂量→选购建议', '使用记录→体感变化→客观指标→总结', '误区澄清→科学解释→正确做法'], ctaPatterns: ['评论区说说你在吃什么', '收藏这篇下次买前看', '主页看更多成分解析'], optimalDuration: '45-90秒' },
      xiaohongshu: { titles: ['营养师拆解！XXX真实功效', '吃了90天，数据说话', '别再被忽悠了！功效食品选购指南', '成分党必看：这个剂量才有用'], keywords: ['功效验证', '成分分析', '剂量', '周期', '性价比'], structures: ['问题引入→成分拆解→有效剂量→选购标准', '使用记录→阶段性体感→体检对比→建议'], interactionDesign: '评论区引导分享使用周期和体感' },
    }),
  },
};

// ─── Auto-init on first call ───
let inited = false;
async function ensureInit() {
  if (inited) return;
  inited = true;
  try {
    const p = getPool();
    if (!p) return;
    await p.execute('SELECT 1');
    console.log('[DB] MySQL connected');

    // Ensure demo user
    const demoExists = await queryOne('SELECT id FROM users WHERE email = ?', ['demo@vocosai.com']);
    if (!demoExists) {
      const hash = bcrypt.hashSync('demo123', 10);
      await query('INSERT INTO users (id, email, name, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)', ['demo-001', 'demo@vocosai.com', '演示用户', hash, 'member', 'active']);
    }

    // Ensure admin user
    const adminExists = await queryOne('SELECT id FROM users WHERE email = ?', ['admin@vocosai.com']);
    if (!adminExists) {
      const hash = bcrypt.hashSync('admin123', 10);
      await query('INSERT INTO users (id, email, name, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)', ['admin-001', 'admin@vocosai.com', '系统管理员', hash, 'super_admin', 'active']);
    }

    // Ensure default team
    const teamExists = await queryOne('SELECT id FROM teams WHERE id = ?', ['default']);
    if (!teamExists) {
      await query('INSERT INTO teams (id, team_name, owner_user_id, plan_type, monthly_quota) VALUES (?, ?, ?, ?, ?)', ['default', '默认团队', 'admin-001', 'free', 1000000]);
    }

    // Ensure team members
    if (!(await queryOne('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', ['default', 'demo-001']))) {
      await query('INSERT INTO team_members (id, team_id, user_id, role) VALUES (?, ?, ?, ?)', ['demo-member', 'default', 'demo-001', 'member']);
    }
    if (!(await queryOne('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', ['default', 'admin-001']))) {
      await query('INSERT INTO team_members (id, team_id, user_id, role) VALUES (?, ?, ?, ?)', ['admin-member', 'default', 'admin-001', 'team_admin']);
    }

    // Ensure categories with rich knowledge base data
    const cats = [
      { id: 'cat-beauty', slug: 'beauty', name: '美妆护肤', icon: '💄', desc: '聚焦护肤品、彩妆、个护产品的评论分析与内容策略', sort: 1 },
      { id: 'cat-maternal', slug: 'maternal', name: '母婴健康', icon: '👶', desc: '聚焦母婴用品、婴幼儿食品、儿童护理的评论分析与内容策略', sort: 2 },
      { id: 'cat-functional-food', slug: 'functional-food', name: '功效食品', icon: '🍵', desc: '聚焦功能性食品、保健品、膳食补充剂的评论分析与内容策略', sort: 3 },
    ];
    for (const c of cats) {
      const exists = await queryOne('SELECT id FROM categories WHERE slug = ?', [c.slug]);
      const seed = CATEGORY_SEED[c.slug] || {};
      if (!exists) {
        await query(
          'INSERT INTO categories (id, name, slug, icon, description, sort_order, knowledge_base, compliance_rules, platform_methodology) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [c.id, c.name, c.slug, c.icon, c.desc, c.sort, seed.knowledgeBase || '{}', seed.complianceRules || '[]', seed.platformMethodology || '{}']
        );
      } else {
        // Update knowledge base if it's empty or just '{}'
        const existing = await queryOne('SELECT knowledge_base FROM categories WHERE slug = ?', [c.slug]);
        const kb = typeof existing.knowledge_base === 'string' ? existing.knowledge_base : JSON.stringify(existing.knowledge_base || {});
        if (kb === '{}' || kb === '') {
          await query(
            'UPDATE categories SET knowledge_base = ?, compliance_rules = ?, platform_methodology = ? WHERE slug = ?',
            [seed.knowledgeBase || '{}', seed.complianceRules || '[]', seed.platformMethodology || '{}', c.slug]
          );
        }
      }
    }

    console.log('[Init] ✅ All essential data initialized');
  } catch (err) {
    console.error('[Init] Error:', err.message);
  }
}

// ─── CORS headers ───
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// ─── JWT verify helper ───
function verifyToken(auth) {
  if (!auth) return null;
  try {
    const token = auth.replace('Bearer ', '');
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// ─── JSON safe parse ───
function safeParse(val) {
  if (!val) return null;
  if (typeof val === 'object') return val;
  try { return JSON.parse(val); } catch { return null; }
}

// ─── Main handler ───
exports.main = async (event) => {
  await ensureInit();

  const { path = '/', httpMethod = 'GET', headers: hdrs = {}, body: raw } = event;
  const body = typeof raw === 'string' ? JSON.parse(raw || '{}') : (raw || {});
  const auth = hdrs?.authorization || hdrs?.Authorization || '';
  const payload = verifyToken(auth);
  const reply = (statusCode, data) => ({ statusCode, headers: CORS_HEADERS, body: JSON.stringify(data) });

  // CORS preflight
  if (httpMethod === 'OPTIONS') return reply(200, {});

  // ─── Health ───
  if (path === '/api/health') {
    const dbOk = getPool() ? 'mysql' : 'no-db';
    return reply(200, { status: 'ok', db: dbOk, time: new Date().toISOString() });
  }

  // ─── Auth ───
  if (path === '/api/auth/login' && httpMethod === 'POST') {
    const { email, password } = body;
    if (!email || !password) return reply(400, { message: '邮箱和密码为必填项' });
    const user = await queryOne('SELECT * FROM users WHERE email = ? AND status = ?', [email, 'active']);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return reply(400, { message: '邮箱或密码错误' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    return reply(200, {
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role, avatarUrl: user.avatar_url || null },
    });
  }

  if (path === '/api/auth/me' && httpMethod === 'GET') {
    if (!payload) return reply(401, { message: '未登录' });
    const user = await queryOne('SELECT * FROM users WHERE id = ? AND status = ?', [payload.id, 'active']);
    if (!user) return reply(401, { message: '用户不存在或已禁用' });
    return reply(200, { id: user.id, email: user.email, name: user.name, role: user.role, status: user.status, avatarUrl: user.avatar_url || null });
  }

  if (path === '/api/auth/register' && httpMethod === 'POST') {
    const { email, password, name } = body;
    if (!email || !password || !name) return reply(400, { message: '邮箱、密码和姓名为必填项' });
    const exists = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (exists) return reply(400, { message: '该邮箱已注册' });
    const id = 'user-' + Date.now();
    const hash = bcrypt.hashSync(password, 10);
    await query('INSERT INTO users (id, email, name, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)', [id, email, name, hash, 'member', 'active']);
    const token = jwt.sign({ id, email, role: 'member' }, JWT_SECRET, { expiresIn: '7d' });
    return reply(200, { token, user: { id, email, name, role: 'member' } });
  }

  if (path === '/api/auth/change-password' && httpMethod === 'POST') {
    if (!payload) return reply(401, { message: '未登录' });
    const { oldPassword, newPassword } = body;
    if (!oldPassword || !newPassword) return reply(400, { message: '请输入旧密码和新密码' });
    const user = await queryOne('SELECT password_hash FROM users WHERE id = ?', [payload.id]);
    if (!user || !bcrypt.compareSync(oldPassword, user.password_hash)) return reply(400, { message: '旧密码错误' });
    const hash = bcrypt.hashSync(newPassword, 10);
    await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, payload.id]);
    return reply(200, { message: '密码修改成功' });
  }

  // ─── Protected routes ───
  if (!payload) return reply(401, { message: '未登录' });

  // ─── Workspace stats ───
  if (path === '/api/workspace/stats' && httpMethod === 'GET') {
    const uid = payload.id;
    const [
      projectRows, taskRows, completedRows, strategyRows, productionRows,
      reviewRows, reportRows, commentRows, recentTasks, categoryStats,
      todayRows,
    ] = await Promise.all([
      query('SELECT COUNT(*) as c FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) AND deleted_at IS NULL', [uid]),
      queryOne('SELECT COUNT(*) as c FROM analysis_tasks WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)', [uid]),
      queryOne('SELECT COUNT(*) as c FROM analysis_tasks WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) AND status = ?', [uid, 'completed']),
      queryOne('SELECT COUNT(*) as c FROM strategy_cards sc JOIN analysis_tasks at ON sc.task_id = at.id WHERE at.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)', [uid]),
      queryOne('SELECT COUNT(*) as c FROM production_cards pc JOIN analysis_tasks at ON pc.task_id = at.id WHERE at.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)', [uid]),
      queryOne('SELECT COUNT(*) as c FROM post_publish_reviews ppr JOIN analysis_tasks at ON ppr.task_id = at.id WHERE at.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)', [uid]),
      queryOne('SELECT COUNT(*) as c FROM reports r JOIN analysis_tasks at ON r.task_id = at.id WHERE at.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)', [uid]),
      queryOne('SELECT COUNT(*) as c FROM comments cm JOIN analysis_tasks at ON cm.task_id = at.id WHERE at.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?)', [uid]),
      query('SELECT at.id, at.task_name, at.platform, at.status, at.project_id, at.created_at, p.project_name, p.category_id, c.name as category_name, c.icon as category_icon FROM analysis_tasks at LEFT JOIN projects p ON at.project_id = p.id LEFT JOIN categories c ON p.category_id = c.id WHERE at.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) ORDER BY at.created_at DESC LIMIT 10', [uid]),
      query('SELECT c.id, c.name, c.icon, COUNT(p.id) as project_count FROM categories c LEFT JOIN projects p ON p.category_id = c.id AND p.deleted_at IS NULL AND p.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) WHERE c.status = ? GROUP BY c.id ORDER BY c.sort_order', [uid, 'active']),
      queryOne('SELECT COUNT(*) as c FROM analysis_tasks WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) AND DATE(created_at) = CURDATE()', [uid]),
    ]);

    return reply(200, {
      projects: projectRows[0]?.c || 0,
      tasks: taskRows?.c || 0,
      completedTasks: completedRows?.c || 0,
      strategyCards: strategyRows?.c || 0,
      productionCards: productionRows?.c || 0,
      reviews: reviewRows?.c || 0,
      reports: reportRows?.c || 0,
      comments: commentRows?.c || 0,
      todayTasks: todayRows?.c || 0,
      recentTasks: recentTasks.map(t => ({
        id: t.id,
        taskName: t.task_name,
        platform: t.platform,
        status: t.status,
        projectId: t.project_id,
        createdAt: t.created_at,
        project: t.project_name ? {
          projectName: t.project_name,
          categoryId: t.category_id,
          category: t.category_name ? { name: t.category_name, icon: t.category_icon } : null,
        } : null,
      })),
      categoryStats: categoryStats.map(c => ({
        id: c.id, name: c.name, icon: c.icon, projectCount: c.project_count,
      })),
    });
  }

  // ─── Workspace health ───
  if (path === '/api/workspace/health' && httpMethod === 'GET') {
    const dbOk = getPool() ? 'connected' : 'disconnected';
    return reply(200, {
      status: dbOk === 'connected' ? 'healthy' : 'degraded',
      version: '5.1.0',
      db: { status: dbOk, type: 'mysql' },
      aiPipeline: { mode: 'cloud-function', agents: 17 },
    });
  }

  // Workspace overview (legacy)
  if (path === '/api/workspace' && httpMethod === 'GET') {
    const [tasks, team] = await Promise.all([
      query('SELECT id, task_name, platform, status, created_at FROM analysis_tasks WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) ORDER BY created_at DESC LIMIT 20', [payload.id]),
      queryOne('SELECT t.* FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.user_id = ? LIMIT 1', [payload.id]),
    ]);
    return reply(200, {
      tasks: tasks.map(t => ({ ...t, taskName: t.task_name, createdAt: t.created_at })),
      team: team ? { id: team.id, teamName: team.team_name, planType: team.plan_type || 'free' } : null,
    });
  }

  // ─── Tasks ───
  if (path === '/api/tasks' && httpMethod === 'GET') {
    const tasks = await query('SELECT * FROM analysis_tasks WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) ORDER BY created_at DESC', [payload.id]);
    return reply(200, { tasks, total: tasks.length });
  }

  const taskMatch = path.match(/^\/api\/tasks\/([^/]+)$/);
  if (taskMatch && httpMethod === 'GET') {
    const task = await queryOne('SELECT * FROM analysis_tasks WHERE id = ?', [taskMatch[1]]);
    if (!task) return reply(404, { message: '任务不存在' });
    return reply(200, task);
  }

  if (path === '/api/tasks' && httpMethod === 'POST') {
    const { taskName, platform, projectId, contentUrl, contentTitle, contentGoal } = body;
    if (!taskName || !platform) return reply(400, { message: '任务名和平台为必填项' });
    const teamMember = await queryOne('SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1', [payload.id]);
    if (!teamMember) return reply(400, { message: '请先加入团队' });
    const id = 'task-' + Date.now();
    await query(
      'INSERT INTO analysis_tasks (id, team_id, project_id, task_name, platform, content_url, content_title, content_goal, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, teamMember.team_id, projectId || null, taskName, platform, contentUrl || null, contentTitle || null, contentGoal || null, 'draft', payload.id]
    );
    return reply(200, { id, message: '任务创建成功' });
  }

  // ─── Projects ───
  if (path === '/api/projects' && httpMethod === 'GET') {
    const projects = await query(
      'SELECT * FROM projects WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) AND deleted_at IS NULL ORDER BY created_at DESC',
      [payload.id]
    );
    return reply(200, {
      projects: projects.map(p => ({
        ...p,
        projectName: p.project_name,
        brandName: p.brand_name,
        productName: p.product_name,
        createdBy: p.created_by,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        deletedAt: p.deleted_at,
      })),
    });
  }

  if (path === '/api/projects' && httpMethod === 'POST') {
    const { projectName, brandName, productName, industry, categoryId, description } = body;
    if (!projectName) return reply(400, { message: '项目名为必填项' });
    const teamMember = await queryOne('SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1', [payload.id]);
    if (!teamMember) return reply(400, { message: '请先加入团队' });
    const id = 'proj-' + Date.now();
    await query(
      'INSERT INTO projects (id, team_id, category_id, project_name, brand_name, product_name, industry, description, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, teamMember.team_id, categoryId || null, projectName, brandName || null, productName || null, industry || null, description || null, payload.id]
    );
    return reply(200, { id, message: '项目创建成功' });
  }

  // ─── Categories ───
  if (path === '/api/categories' && httpMethod === 'GET') {
    const cats = await query('SELECT * FROM categories WHERE status = ? ORDER BY sort_order', ['active']);
    return reply(200, cats.map(c => ({
      id: c.id, name: c.name, slug: c.slug, icon: c.icon, description: c.description, sortOrder: c.sort_order,
      knowledgeBase: safeParse(c.knowledge_base) || {},
      complianceRules: safeParse(c.compliance_rules) || [],
      platformMethodology: safeParse(c.platform_methodology) || {},
    })));
  }

  // Single category
  const categoryMatch = path.match(/^\/api\/categories\/(.+)$/);
  if (categoryMatch && httpMethod === 'GET') {
    const cat = await queryOne('SELECT * FROM categories WHERE id = ? AND status = ?', [categoryMatch[1], 'active']);
    if (!cat) return reply(404, { message: '品类不存在' });
    return reply(200, {
      id: cat.id, name: cat.name, slug: cat.slug, icon: cat.icon, description: cat.description,
      knowledgeBase: safeParse(cat.knowledge_base) || {},
      complianceRules: safeParse(cat.compliance_rules) || [],
      platformMethodology: safeParse(cat.platform_methodology) || {},
    });
  }

  // ─── Brands ───
  if (path === '/api/brands' && httpMethod === 'GET') {
    const brands = await query('SELECT * FROM brands WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) AND status = ?', [payload.id, 'active']);
    return reply(200, brands.map(b => ({
      id: b.id, name: b.name, industry: b.industry, positioning: b.positioning, tone: b.tone,
      sellingPoints: safeParse(b.selling_points) || [],
      taboos: safeParse(b.taboos) || [],
    })));
  }

  if (path === '/api/brands' && httpMethod === 'POST') {
    const { name, industry, positioning, tone } = body;
    if (!name) return reply(400, { message: '品牌名为必填项' });
    const teamMember = await queryOne('SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1', [payload.id]);
    if (!teamMember) return reply(400, { message: '请先加入团队' });
    const id = 'brand-' + Date.now();
    await query('INSERT INTO brands (id, team_id, name, industry, positioning, tone, selling_points, taboos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, teamMember.team_id, name, industry || null, positioning || null, tone || null, JSON.stringify(body.sellingPoints || []), JSON.stringify(body.taboos || [])]);
    return reply(200, { id, message: '品牌创建成功' });
  }

  // ─── Teams ───
  if (path === '/api/teams/default' && httpMethod === 'GET') {
    const team = await queryOne('SELECT t.* FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.user_id = ? LIMIT 1', [payload.id]);
    if (!team) return reply(404, { message: '未找到团队' });
    return reply(200, { id: team.id, teamName: team.team_name, planType: team.plan_type, status: team.status, monthlyQuota: team.monthly_quota, usedQuota: team.used_quota });
  }

  // ─── Reviews (PostPublishReview) ───
  if (path === '/api/reviews' && httpMethod === 'GET') {
    const reviews = await query(
      'SELECT ppr.*, at.task_name FROM post_publish_reviews ppr JOIN analysis_tasks at ON ppr.task_id = at.id WHERE at.team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) ORDER BY ppr.created_at DESC',
      [payload.id]
    );
    return reply(200, reviews.map(r => ({
      id: r.id, taskId: r.task_id, taskName: r.task_name,
      newContentUrl: r.new_content_url, newContentTitle: r.new_content_title, newContentBody: r.new_content_body,
      strategyExecutionScore: r.strategy_execution_score || 0,
      cardEffectivenessScore: r.card_effectiveness_score || 0,
      metrics: safeParse(r.metrics),
      commentChangeAssessment: safeParse(r.comment_change_assessment),
      nextRoundSuggestions: safeParse(r.next_round_suggestions),
      status: r.status, createdAt: r.created_at,
    })));
  }

  if (path === '/api/reviews' && httpMethod === 'POST') {
    const { taskId, newContentUrl, newContentTitle, newContentBody } = body;
    if (!taskId) return reply(400, { message: '任务ID为必填项' });
    // Verify task belongs to user's team
    const task = await queryOne('SELECT team_id FROM analysis_tasks WHERE id = ?', [taskId]);
    if (!task) return reply(400, { message: '任务不存在' });
    const member = await queryOne('SELECT team_id FROM team_members WHERE user_id = ? AND team_id = ?', [payload.id, task.team_id]);
    if (!member) return reply(403, { message: '无权限操作此任务' });

    const id = 'review-' + Date.now();
    await query(
      'INSERT INTO post_publish_reviews (id, task_id, new_content_url, new_content_title, new_content_body, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, taskId, newContentUrl || null, newContentTitle || null, newContentBody || null, 'pending']
    );
    return reply(200, { id, message: '复盘任务创建成功' });
  }

  const reviewMatch = path.match(/^\/api\/reviews\/(.+)$/);
  if (reviewMatch && httpMethod === 'GET') {
    const review = await queryOne('SELECT ppr.*, at.task_name FROM post_publish_reviews ppr JOIN analysis_tasks at ON ppr.task_id = at.id WHERE ppr.id = ?', [reviewMatch[1]]);
    if (!review) return reply(404, { message: '复盘不存在' });
    return reply(200, {
      id: review.id, taskId: review.task_id, taskName: review.task_name,
      newContentUrl: review.new_content_url, newContentTitle: review.new_content_title, newContentBody: review.new_content_body,
      strategyExecutionScore: review.strategy_execution_score || 0,
      cardEffectivenessScore: review.card_effectiveness_score || 0,
      metrics: safeParse(review.metrics),
      commentChangeAssessment: safeParse(review.comment_change_assessment),
      nextRoundSuggestions: safeParse(review.next_round_suggestions),
      status: review.status, createdAt: review.created_at,
    });
  }

  // ─── AI agents ───
  if (path === '/api/ai/agents' && httpMethod === 'GET') {
    const agents = await query('SELECT * FROM ai_agents WHERE status = ? ORDER BY execution_order', ['active']);
    return reply(200, agents.map(a => ({
      id: a.id, agentName: a.agent_name, agentCode: a.agent_code,
      executionOrder: a.execution_order, canParallel: !!a.can_parallel,
    })));
  }

  // ─── Task sub-resources ───
  const commentsMatch = path.match(/^\/api\/tasks\/([^/]+)\/comments$/);
  if (commentsMatch && httpMethod === 'GET') {
    const comments = await query('SELECT * FROM comments WHERE task_id = ? ORDER BY created_at DESC LIMIT 200', [commentsMatch[1]]);
    return reply(200, { comments, total: comments.length });
  }

  const reportsMatch = path.match(/^\/api\/tasks\/([^/]+)\/reports$/);
  if (reportsMatch && httpMethod === 'GET') {
    const reports = await query('SELECT * FROM reports WHERE task_id = ? ORDER BY created_at DESC', [reportsMatch[1]]);
    return reply(200, { reports });
  }

  const strategyMatch = path.match(/^\/api\/tasks\/([^/]+)\/strategy-cards$/);
  if (strategyMatch && httpMethod === 'GET') {
    const cards = await query('SELECT * FROM strategy_cards WHERE task_id = ? ORDER BY created_at', [strategyMatch[1]]);
    return reply(200, { cards });
  }

  const productionMatch = path.match(/^\/api\/tasks\/([^/]+)\/production-cards$/);
  if (productionMatch && httpMethod === 'GET') {
    const cards = await query('SELECT * FROM production_cards WHERE task_id = ? ORDER BY created_at', [productionMatch[1]]);
    return reply(200, { cards });
  }

  // Reviews for a task
  const taskReviewsMatch = path.match(/^\/api\/tasks\/([^/]+)\/reviews$/);
  if (taskReviewsMatch && httpMethod === 'GET') {
    const reviews = await query('SELECT * FROM post_publish_reviews WHERE task_id = ? ORDER BY created_at DESC', [taskReviewsMatch[1]]);
    return reply(200, { reviews });
  }

  // ─── Admin: model providers / configs ───
  if (path === '/api/model-providers' && httpMethod === 'GET') {
    const providers = await query('SELECT id, provider_name, base_url, status FROM model_providers WHERE status = ?', ['active']);
    return reply(200, { providers });
  }

  if (path === '/api/model-configs' && httpMethod === 'GET') {
    const configs = await query('SELECT mc.*, mp.provider_name FROM model_configs mc JOIN model_providers mp ON mc.provider_id = mp.id WHERE mc.is_active = 1', []);
    return reply(200, { configs });
  }

  // Catch-all
  return reply(200, {});
};
