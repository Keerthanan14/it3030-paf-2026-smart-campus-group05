import { type HTMLAttributes } from 'react';
import { twMerge } from 'tailwind-merge';
import clsx from 'clsx';

export type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={twMerge(
        clsx(
          'animate-pulse rounded-md bg-muted',
          className
        )
      )}
      {...props}
    />
  );
}
