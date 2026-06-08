import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isVerifying: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  verify: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: localStorage.getItem('vocosai-token'),
  isAuthenticated: false, // Don't auto-login until token is verified
  isVerifying: true,

  verify: async () => {
    const token = localStorage.getItem('vocosai-token');
    if (!token) {
      set({ isAuthenticated: false, isVerifying: false });
      return;
    }
    try {
      // 调用 /api/auth/me 验证 token 是否仍有效
      const res = await fetch(
        `${(window as any).VOCOS_API_BASE || ''}/api/auth/me`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const user = await res.json();
        set({ user, token, isAuthenticated: true, isVerifying: false });
      } else {
        localStorage.removeItem('vocosai-token');
        set({ user: null, token: null, isAuthenticated: false, isVerifying: false });
      }
    } catch {
      // 网络不可用但有 token → 允许离线登录
      set({ isAuthenticated: true, isVerifying: false });
    }
  },

  login: (user, token) => {
    localStorage.setItem('vocosai-token', token);
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('vocosai-token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  setUser: (user) => set({ user }),
}));
