import type { ReactNode } from 'react';

interface StickyPageHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
  meta?: ReactNode;
}

export function StickyPageHeader({ title, description, action, meta }: StickyPageHeaderProps) {
  return (
    <div className="sticky top-0 z-30 -mx-4 border-b border-border/70 bg-background/95 px-4 py-4 backdrop-blur supports-backdrop-filter:bg-background/80 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="min-w-0 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <p className="mt-1 text-sm text-foreground/70">{description}</p>
      {meta ? <div className="mt-3">{meta}</div> : null}
    </div>
  );
}