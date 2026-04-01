import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
}

const TOKEN_KEY = import.meta.env.VITE_JWT_STORAGE_KEY || 'access_token';

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