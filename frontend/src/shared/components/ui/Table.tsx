import { type HTMLAttributes, type ThHTMLAttributes, type TdHTMLAttributes } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function Table({ className, children, ...props }: HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto rounded-lg ring-1 ring-border">
      <table className={twMerge(clsx('min-w-full divide-y divide-border text-foreground', className))} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className={twMerge(clsx('bg-muted/50', className))} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody className={twMerge(clsx('divide-y divide-border bg-background', className))} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className={twMerge(clsx('hover:bg-muted/30 transition-colors', className))} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={twMerge(
        clsx(
          'px-6 py-3 text-left text-xs font-medium text-foreground/70 uppercase tracking-wider',
          className
        )
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className={twMerge(clsx('px-6 py-4 whitespace-nowrap text-sm text-foreground/80', className))} {...props}>
      {children}
    </td>
  );
}
