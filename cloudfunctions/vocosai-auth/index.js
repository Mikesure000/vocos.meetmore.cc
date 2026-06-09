const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'vocosai-prod-2026-secure';
const DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@vocosai.com',
  name: '演示用户',
  role: 'member',
};
const DEMO_PASS_HASH = bcrypt.hashSync('demo123', 10);
const ADMIN_USER = {
  id: 'admin-user-001',
  email: 'admin@vocosai.com',
  name: '系统管理员',
  role: 'super_admin',
};
const ADMIN_PASS_HASH = bcrypt.hashSync('admin123', 10);

const USERS = {
  'demo@vocosai.com': { ...DEMO_USER, passwordHash: DEMO_PASS_HASH },
  'admin@vocosai.com': { ...ADMIN_USER, passwordHash: ADMIN_PASS_HASH },
};

exports.main = async (event) => {
  const { path, httpMethod, body: rawBody } = event;
  
  // CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  };
  
  if (httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody || {};

    // POST /login
    if (path === '/login' && httpMethod === 'POST') {
      const { email, password } = body;
      if (!email || !password) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: '邮箱和密码为必填项' }) };
      }
      const user = USERS[email];
      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ message: '邮箱或密码错误' }) };
      }
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
      return {
        statusCode: 200, headers: corsHeaders,
        body: JSON.stringify({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }),
      };
    }

    // GET /me (verify token)
    if (path === '/me' && httpMethod === 'GET') {
      const auth = event.headers?.authorization || event.headers?.Authorization || '';
      const token = auth.replace('Bearer ', '');
      if (!token) {
        return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ message: '未登录' }) };
      }
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = USERS[decoded.email];
        if (!user) throw new Error('user not found');
        return {
          statusCode: 200, headers: corsHeaders,
          body: JSON.stringify({ id: user.id, email: user.email, name: user.name, role: user.role, status: 'active' }),
        };
      } catch {
        return { statusCode: 401, headers: corsHeaders, body: JSON.stringify({ message: 'Token无效或已过期' }) };
      }
    }

    return { statusCode: 404, headers: corsHeaders, body: JSON.stringify({ message: 'Not found' }) };
  } catch (err) {
    return { statusCode: 500, headers: corsHeaders, body: JSON.stringify({ message: err.message }) };
  }
};
