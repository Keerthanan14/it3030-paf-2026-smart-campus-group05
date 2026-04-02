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
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

const variantStyles: Record<ToastType, string> = {
  success: 'text-success',
  error: 'text-error',
  info: 'text-info',
  warning: 'text-warning',
};

export function Toast({ id, type = 'info', title, description, onClose }: ToastProps) {
  const Icon = icons[type];

  return (
    <div
      className={twMerge(
        clsx(
          'pointer-events-auto flex h-24 w-[360px] items-start space-x-4 overflow-hidden rounded-lg bg-background p-4 shadow-lg ring-1 ring-border',
        )
      )}
    >
      <div className="flex-shrink-0">
        <Icon className={clsx('h-5 w-5', variantStyles[type])} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={clsx('line-clamp-1 text-sm font-semibold', variantStyles[type])}>{title}</p>
        {description && (
          <p className="mt-1 line-clamp-2 text-sm text-foreground/80">{description}</p>
        )}
      </div>
      <button
        onClick={() => onClose(id)}
        className="inline-flex shrink-0 self-start rounded-md text-foreground/55 hover:text-foreground focus:outline-none"
      >
        <span className="sr-only">Close</span>
        <X className="h-5 w-5" />
      </button>
    </div>
  );
}
