import { type HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'rounded-lg border border-border bg-background text-foreground shadow-sm',
          className
        )
      )}
      {...props}
    />
  );
}
