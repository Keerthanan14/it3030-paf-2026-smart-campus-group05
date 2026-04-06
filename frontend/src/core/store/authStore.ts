import { create } from 'zustand';
import type { AuthState } from '../../types/auth';

export const TOKEN_KEY = import.meta.env.VITE_JWT_STORAGE_KEY || 'access_token';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY),
  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, isAuthenticated: false });
  },
}));