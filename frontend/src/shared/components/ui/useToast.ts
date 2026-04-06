import { create } from 'zustand';
import type { ToastType } from './Toast';

interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ShowToastParams {
  type?: ToastType;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastStoreState {
  toasts: ToastItem[];
  closeToast: (id: string) => void;
  showToast: (params: ShowToastParams) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

export const useToastStore = create<ToastStoreState>((set, get) => ({
  toasts: [],
  closeToast: (id: string) => {
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) }));
  },
  showToast: ({ type = 'info', title, description, durationMs = 3500 }: ShowToastParams) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    set((state) => ({
      toasts: [...state.toasts, { id, type, title, description }],
    }));

    window.setTimeout(() => {
      get().closeToast(id);
    }, durationMs);
  },
  success: (title: string, description?: string) => {
    get().showToast({ type: 'success', title, description });
  },
  error: (title: string, description?: string) => {
    get().showToast({ type: 'error', title, description });
  },
  warning: (title: string, description?: string) => {
    get().showToast({ type: 'warning', title, description });
  },
  info: (title: string, description?: string) => {
    get().showToast({ type: 'info', title, description });
  },
}));

export function useToast() {
  const showToast = useToastStore((state) => state.showToast);
  const success = useToastStore((state) => state.success);
  const error = useToastStore((state) => state.error);
  const warning = useToastStore((state) => state.warning);
  const info = useToastStore((state) => state.info);

  return { showToast, success, error, warning, info };
}
