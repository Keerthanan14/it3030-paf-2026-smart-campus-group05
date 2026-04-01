import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  type?: ToastType;
  title: string;
  description?: string;
  onClose: (id: string) => void;
}

const icons = {
  success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
  error: <AlertCircle className="h-5 w-5 text-red-500" />,
  info: <Info className="h-5 w-5 text-blue-500" />,
  warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
};

export function Toast({ id, type = 'info', title, description, onClose }: ToastProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'pointer-events-auto flex w-full max-w-md items-start space-x-4 rounded-lg bg-background p-4 shadow-lg ring-1 ring-border',
        )
      )}
    >
      <div className="flex-shrink-0">{icons[type]}</div>
      <div className="flex-1 pt-0.5">
        <p className="text-sm font-medium text-foreground">{title}</p>
        {description && (
          <p className="mt-1 text-sm text-foreground/70">{description}</p>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className="inline-flex shrink-0 rounded-md text-foreground/50 hover:text-foreground focus:outline-none"
      >
        <span className="sr-only">Close</span>
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
