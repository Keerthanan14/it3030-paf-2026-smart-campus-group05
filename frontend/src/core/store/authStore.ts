import { create } from 'zustand';
import type { AuthState } from '../../types/auth';

export const TOKEN_KEY = import.meta.env.VITE_JWT_STORAGE_KEY || 'access_token';
export const USER_KEY = import.meta.env.VITE_AUTH_USER_STORAGE_KEY || 'auth_user';

function loadStoredUser() {
  try {
    const rawUser = localStorage.getItem(USER_KEY);
    return rawUser ? JSON.parse(rawUser) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: loadStoredUser(),
  isAuthenticated: !!localStorage.getItem(TOKEN_KEY) && !!loadStoredUser(),
  setAuth: (user, token) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, isAuthenticated: false });
  },
}));