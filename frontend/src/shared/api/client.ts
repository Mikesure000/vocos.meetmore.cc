import axios from 'axios';

// 生产环境使用独立 API 域名，开发环境使用本地代理
const API_BASE = (window as any).VOCOS_API_BASE || '';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('vocosai-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('vocosai-token');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    // Transform error for consistent handling
    const message = err.response?.data?.message || err.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

// Utility: check backend health
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/health`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}
