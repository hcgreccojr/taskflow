import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as authApi from '../../../services/authApi';
import * as usersApi from '../../../services/usersApi';
import { setTokens } from '../../../services/httpClient';
import type { User } from '../../../shared/types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  status: 'idle' | 'ready';
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  bootstrap: () => Promise<void>;
}

function syncTokens(accessToken: string | null, refreshToken: string | null): void {
  if (accessToken && refreshToken) {
    setTokens({ accessToken, refreshToken });
  } else {
    setTokens(null);
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      status: 'idle',

      login: async (email, password) => {
        const result = await authApi.login({ email, password });
        syncTokens(result.accessToken, result.refreshToken);
        set({ accessToken: result.accessToken, refreshToken: result.refreshToken });
        const user = await usersApi.getMe();
        set({ user, status: 'ready' });
      },

      register: async (name, email, password) => {
        await authApi.register({ name, email, password });
        await get().login(email, password);
      },

      logout: () => {
        syncTokens(null, null);
        set({ accessToken: null, refreshToken: null, user: null, status: 'ready' });
      },

      bootstrap: async () => {
        const { accessToken, refreshToken, status } = get();
        if (status === 'ready') return;

        if (!accessToken || !refreshToken) {
          set({ status: 'ready' });
          return;
        }

        syncTokens(accessToken, refreshToken);
        try {
          const user = await usersApi.getMe();
          set({ user, status: 'ready' });
        } catch {
          syncTokens(null, null);
          set({ accessToken: null, refreshToken: null, user: null, status: 'ready' });
        }
      },
    }),
    {
      name: 'taskflow-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
      }),
    },
  ),
);

if (typeof window !== 'undefined') {
  window.addEventListener('auth:logout', () => {
    useAuthStore.getState().logout();
  });
}
