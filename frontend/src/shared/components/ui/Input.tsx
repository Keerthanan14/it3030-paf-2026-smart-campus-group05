import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  endAdornment?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, endAdornment, id, ...props }, ref) => {
    const defaultId = useId();
    const inputId = id || defaultId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium leading-6 text-foreground mb-1">
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          <input
            id={inputId}
            ref={ref}
            className={twMerge(
              clsx(
                'block w-full rounded-md border border-border bg-background py-1.5 px-3 text-foreground ring-1 ring-inset ring-transparent focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 disabled:cursor-not-allowed disabled:bg-muted disabled:text-foreground/50',
                endAdornment && 'pr-10',
                error
                  ? 'border-error ring-error focus:ring-error text-error placeholder:text-error/70'
                  : 'focus:ring-primary focus:border-primary placeholder:text-foreground/40',
                className
              )
            )}
            {...props}
          />
          {endAdornment && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              {endAdornment}
            </div>
          )}
        </div>
        {(error || helperText) && (
          <p className={clsx('mt-2 text-sm', error ? 'text-error' : 'text-foreground/60')}>
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
