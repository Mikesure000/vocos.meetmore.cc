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

// ─── Auto-init on first call ───
let inited = false;
async function ensureInit() {
  if (inited) return;
  inited = true;
  try {
    const p = getPool();
    if (!p) return;
    // Test connection
    await p.execute('SELECT 1');
    console.log('[DB] MySQL connected');

    // Ensure demo user exists
    const demoExists = await queryOne('SELECT id FROM users WHERE email = ?', ['demo@vocosai.com']);
    if (!demoExists) {
      const hash = bcrypt.hashSync('demo123', 10);
      await query(
        'INSERT INTO users (id, email, name, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['demo-001', 'demo@vocosai.com', '演示用户', hash, 'member', 'active']
      );
      console.log('[Init] Demo user created');
    }

    // Ensure admin user exists
    const adminExists = await queryOne('SELECT id FROM users WHERE email = ?', ['admin@vocosai.com']);
    if (!adminExists) {
      const hash = bcrypt.hashSync('admin123', 10);
      await query(
        'INSERT INTO users (id, email, name, password_hash, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        ['admin-001', 'admin@vocosai.com', '系统管理员', hash, 'super_admin', 'active']
      );
      console.log('[Init] Admin user created');
    }

    // Ensure default team
    const teamExists = await queryOne('SELECT id FROM teams WHERE id = ?', ['default']);
    if (!teamExists) {
      await query(
        'INSERT INTO teams (id, team_name, owner_user_id, plan_type, monthly_quota) VALUES (?, ?, ?, ?, ?)',
        ['default', '默认团队', 'admin-001', 'free', 1000000]
      );
      console.log('[Init] Default team created');
    }

    // Ensure team members
    const demoMember = await queryOne('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', ['default', 'demo-001']);
    if (!demoMember) {
      await query('INSERT INTO team_members (id, team_id, user_id, role) VALUES (?, ?, ?, ?)', ['demo-member', 'default', 'demo-001', 'member']);
    }
    const adminMember = await queryOne('SELECT id FROM team_members WHERE team_id = ? AND user_id = ?', ['default', 'admin-001']);
    if (!adminMember) {
      await query('INSERT INTO team_members (id, team_id, user_id, role) VALUES (?, ?, ?, ?)', ['admin-member', 'default', 'admin-001', 'team_admin']);
    }

    // Ensure categories
    const cats = [
      { id: 'cat-beauty', slug: 'beauty', name: '美妆护肤', icon: '💄', desc: '聚焦护肤品、彩妆、个护产品的评论分析与内容策略' },
      { id: 'cat-maternal', slug: 'maternal', name: '母婴健康', icon: '👶', desc: '聚焦母婴用品、婴幼儿食品、儿童护理的评论分析与内容策略' },
      { id: 'cat-functional-food', slug: 'functional-food', name: '功效食品', icon: '🍵', desc: '聚焦功能性食品、保健品、膳食补充剂的评论分析与内容策略' },
    ];
    for (const c of cats) {
      const exists = await queryOne('SELECT id FROM categories WHERE slug = ?', [c.slug]);
      if (!exists) {
        await query(
          'INSERT INTO categories (id, name, slug, icon, description, knowledge_base, compliance_rules, platform_methodology) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [c.id, c.name, c.slug, c.icon, c.desc, '{}', '[]', '{}']
        );
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

  // Workspace overview
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

  // Tasks
  if (path === '/api/tasks' && httpMethod === 'GET') {
    const tasks = await query(
      'SELECT * FROM analysis_tasks WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) ORDER BY created_at DESC',
      [payload.id]
    );
    return reply(200, { tasks, total: tasks.length });
  }

  // Single task
  const taskMatch = path.match(/^\/api\/tasks\/(.+)$/);
  if (taskMatch && httpMethod === 'GET') {
    const task = await queryOne('SELECT * FROM analysis_tasks WHERE id = ?', [taskMatch[1]]);
    if (!task) return reply(404, { message: '任务不存在' });
    return reply(200, task);
  }

  // Create task
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

  // Projects
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

  // Create project
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

  // Categories
  if (path === '/api/categories' && httpMethod === 'GET') {
    const cats = await query('SELECT * FROM categories WHERE status = ? ORDER BY sort_order', ['active']);
    return reply(200, cats.map(c => ({
      id: c.id, name: c.name, slug: c.slug, icon: c.icon,
      description: c.description,
      knowledgeBase: typeof c.knowledge_base === 'string' ? JSON.parse(c.knowledge_base || '{}') : c.knowledge_base,
      complianceRules: typeof c.compliance_rules === 'string' ? JSON.parse(c.compliance_rules || '[]') : c.compliance_rules,
    })));
  }

  // Brands
  if (path === '/api/brands' && httpMethod === 'GET') {
    const brands = await query(
      'SELECT * FROM brands WHERE team_id IN (SELECT team_id FROM team_members WHERE user_id = ?) AND status = ?',
      [payload.id, 'active']
    );
    return reply(200, brands.map(b => ({
      id: b.id, name: b.name, industry: b.industry, positioning: b.positioning, tone: b.tone,
      sellingPoints: typeof b.selling_points === 'string' ? JSON.parse(b.selling_points || '[]') : b.selling_points,
      taboos: typeof b.taboos === 'string' ? JSON.parse(b.taboos || '[]') : b.taboos,
    })));
  }

  // Create brand
  if (path === '/api/brands' && httpMethod === 'POST') {
    const { name, industry, positioning, tone } = body;
    if (!name) return reply(400, { message: '品牌名为必填项' });
    const teamMember = await queryOne('SELECT team_id FROM team_members WHERE user_id = ? LIMIT 1', [payload.id]);
    if (!teamMember) return reply(400, { message: '请先加入团队' });
    const id = 'brand-' + Date.now();
    await query(
      'INSERT INTO brands (id, team_id, name, industry, positioning, tone, selling_points, taboos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, teamMember.team_id, name, industry || null, positioning || null, tone || null, JSON.stringify(body.sellingPoints || []), JSON.stringify(body.taboos || [])]
    );
    return reply(200, { id, message: '品牌创建成功' });
  }

  // Teams
  if (path === '/api/teams/default' && httpMethod === 'GET') {
    const team = await queryOne('SELECT t.* FROM teams t JOIN team_members tm ON t.id = tm.team_id WHERE tm.user_id = ? LIMIT 1', [payload.id]);
    if (!team) return reply(404, { message: '未找到团队' });
    return reply(200, { id: team.id, teamName: team.team_name, planType: team.plan_type, status: team.status, monthlyQuota: team.monthly_quota, usedQuota: team.used_quota });
  }

  // AI agents
  if (path === '/api/ai/agents' && httpMethod === 'GET') {
    const agents = await query('SELECT * FROM ai_agents WHERE status = ? ORDER BY execution_order', ['active']);
    return reply(200, agents.map(a => ({
      id: a.id, agentName: a.agent_name, agentCode: a.agent_code,
      executionOrder: a.execution_order, canParallel: !!a.can_parallel,
    })));
  }

  // Comments for a task
  const commentsMatch = path.match(/^\/api\/tasks\/([^/]+)\/comments$/);
  if (commentsMatch && httpMethod === 'GET') {
    const comments = await query('SELECT * FROM comments WHERE task_id = ? ORDER BY created_at DESC LIMIT 200', [commentsMatch[1]]);
    return reply(200, { comments, total: comments.length });
  }

  // Reports for a task
  const reportsMatch = path.match(/^\/api\/tasks\/([^/]+)\/reports$/);
  if (reportsMatch && httpMethod === 'GET') {
    const reports = await query('SELECT * FROM reports WHERE task_id = ? ORDER BY created_at DESC', [reportsMatch[1]]);
    return reply(200, { reports });
  }

  // Strategy cards for a task
  const strategyMatch = path.match(/^\/api\/tasks\/([^/]+)\/strategy-cards$/);
  if (strategyMatch && httpMethod === 'GET') {
    const cards = await query('SELECT * FROM strategy_cards WHERE task_id = ? ORDER BY created_at', [strategyMatch[1]]);
    return reply(200, { cards });
  }

  // Production cards for a task
  const productionMatch = path.match(/^\/api\/tasks\/([^/]+)\/production-cards$/);
  if (productionMatch && httpMethod === 'GET') {
    const cards = await query('SELECT * FROM production_cards WHERE task_id = ? ORDER BY created_at', [productionMatch[1]]);
    return reply(200, { cards });
  }

  // Model providers
  if (path === '/api/model-providers' && httpMethod === 'GET') {
    const providers = await query('SELECT id, provider_name, base_url, status FROM model_providers WHERE status = ?', ['active']);
    return reply(200, { providers });
  }

  // Model configs
  if (path === '/api/model-configs' && httpMethod === 'GET') {
    const configs = await query('SELECT mc.*, mp.provider_name FROM model_configs mc JOIN model_providers mp ON mc.provider_id = mp.id WHERE mc.is_active = 1', []);
    return reply(200, { configs });
  }

  // Catch-all
  return reply(200, {});
};
