// ═══════════════════════════════════
// VocosAI Light Server — Cloud Function
// ═══════════════════════════════════
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vocosai-prod-2026-secure';

// Demo users
const DEMO = { id: 'demo-001', email: 'demo@vocosai.com', name: '演示用户', role: 'member', pass: bcrypt.hashSync('demo123', 10) };
const ADMIN = { id: 'admin-001', email: 'admin@vocosai.com', name: '系统管理员', role: 'super_admin', pass: bcrypt.hashSync('admin123', 10) };
const USERS = { [DEMO.email]: DEMO, [ADMIN.email]: ADMIN };

// Demo data
const DEMO_TASKS = [{
  id: 'demo-task', taskName: 'Demo - 完美日记小细跟口红', platform: 'douyin', status: 'completed',
  contentTitle: '几十块的口红和大牌到底差在哪？', contentGoal: '转化成交',
  stats: { totalComments: 22, highValue: 8, demandCount: 5, barrierCount: 3 }
}];

exports.main = async (event) => {
  const { path, httpMethod, headers: hdrs, body: raw } = event;
  const h = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
  if (httpMethod === 'OPTIONS') return { statusCode: 200, headers: h, body: '' };

  const body = typeof raw === 'string' ? JSON.parse(raw) : (raw || {});
  const auth = (hdrs?.authorization || hdrs?.Authorization || '').replace('Bearer ', '');
  let user = null;
  if (auth) {
    try { const d = jwt.verify(auth, JWT_SECRET); user = USERS[d.email] || null; } catch {}
  }

  // ─── Auth ───
  if (path === '/api/auth/login' && httpMethod === 'POST') {
    const { email, password } = body;
    if (!email || !password) return { statusCode: 400, headers: h, body: JSON.stringify({ message: '邮箱和密码为必填项' }) };
    const u = USERS[email];
    if (!u || !bcrypt.compareSync(password, u.pass)) return { statusCode: 400, headers: h, body: JSON.stringify({ message: '邮箱或密码错误' }) };
    const token = jwt.sign({ id: u.id, email: u.email, role: u.role }, JWT_SECRET, { expiresIn: '7d' });
    return { statusCode: 200, headers: h, body: JSON.stringify({ token, user: { id: u.id, email: u.email, name: u.name, role: u.role } }) };
  }
  if (path === '/api/auth/me' && httpMethod === 'GET') {
    if (!user) return { statusCode: 401, headers: h, body: JSON.stringify({ message: '未登录' }) };
    return { statusCode: 200, headers: h, body: JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, status: 'active' }) };
  }
  if (path === '/api/auth/register' && httpMethod === 'POST') {
    return { statusCode: 200, headers: h, body: JSON.stringify({ id: 'new-' + Date.now(), message: '注册成功' }) };
  }

  // ─── Protected routes ───
  if (!user) return { statusCode: 401, headers: h, body: JSON.stringify({ message: '未登录' }) };

  // Workspace
  if (path === '/api/workspace' && httpMethod === 'GET') {
    return { statusCode: 200, headers: h, body: JSON.stringify({ tasks: DEMO_TASKS, team: { teamName: '默认团队', planType: 'free' } }) };
  }
  // Tasks list
  if (path === '/api/tasks' && httpMethod === 'GET') {
    return { statusCode: 200, headers: h, body: JSON.stringify({ tasks: DEMO_TASKS, total: 1 }) };
  }
  // Single task
  const taskMatch = path.match(/^\/api\/tasks\/(.+)$/);
  if (taskMatch && httpMethod === 'GET') {
    return { statusCode: 200, headers: h, body: JSON.stringify(DEMO_TASKS[0]) };
  }
  // Projects
  if (path === '/api/projects' && httpMethod === 'GET') {
    return { statusCode: 200, headers: h, body: JSON.stringify({ projects: [{ id: 'demo-project', projectName: '示例项目', brandName: '完美日记', industry: '美妆护肤', status: 'active' }] }) };
  }
  if (path === '/api/categories' && httpMethod === 'GET') {
    return { statusCode: 200, headers: h, body: JSON.stringify([{ id: 'cat-beauty', name: '美妆护肤', slug: 'beauty', icon: '💄' }, { id: 'cat-maternal', name: '母婴健康', slug: 'maternal', icon: '👶' }, { id: 'cat-functional-food', name: '功效食品', slug: 'functional-food', icon: '🍵' }]) };
  }
  if (path === '/api/brands' && httpMethod === 'GET') {
    return { statusCode: 200, headers: h, body: JSON.stringify([{ id: 'b-1', name: '完美日记', industry: '美妆护肤' }, { id: 'b-2', name: '花西子', industry: '美妆护肤' }]) };
  }
  if (path === '/api/teams/default' && httpMethod === 'GET') {
    return { statusCode: 200, headers: h, body: JSON.stringify({ id: 'default', teamName: '默认团队', planType: 'free', status: 'active' }) };
  }
  if (path === '/api/ai/agents' && httpMethod === 'GET') {
    return { statusCode: 200, headers: h, body: JSON.stringify([]) };
  }

  // Health
  if (path === '/api/health') {
    return { statusCode: 200, headers: h, body: JSON.stringify({ status: 'ok' }) };
  }

  return { statusCode: 200, headers: h, body: JSON.stringify({}) };
};
