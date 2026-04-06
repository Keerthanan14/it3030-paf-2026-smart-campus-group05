import type { ReactNode } from 'react';
import { Toast } from './Toast';
import { useToastStore } from './useToast';

export function ToastProvider({ children }: { children: ReactNode }) {
  const toasts = useToastStore((state) => state.toasts);
  const closeToast = useToastStore((state) => state.closeToast);

  return (
    <>
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
    </>
  );
}
