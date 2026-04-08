import { useEffect, type ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      <div 
        className={twMerge(
          clsx(
            'relative z-50 w-full max-w-lg rounded-lg bg-background p-6 shadow-xl ring-1 ring-border sm:my-8',
            className
          )
        )}
      >
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
          <button
            onClick={onClose}
            className="rounded-full p-1 text-foreground/70 transition-colors hover:bg-rose-100 hover:text-rose-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="text-foreground">
          {children}
        </div>
      </div>
    </div>
  );
}
