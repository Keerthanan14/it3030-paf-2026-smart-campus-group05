import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Toast, type ToastType } from './Toast';

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

interface ToastContextValue {
  showToast: (params: ShowToastParams) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  warning: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const closeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(({ type = 'info', title, description, durationMs = 3500 }: ShowToastParams) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    setToasts((prev) => [...prev, { id, type, title, description }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, durationMs);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (title, description) => showToast({ type: 'success', title, description }),
      error: (title, description) => showToast({ type: 'error', title, description }),
      warning: (title, description) => showToast({ type: 'warning', title, description }),
      info: (title, description) => showToast({ type: 'info', title, description }),
    }),
    [showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-20 z-[70] space-y-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            title={toast.title}
            description={toast.description}
            onClose={closeToast}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used inside ToastProvider');
  }

  return context;
}
