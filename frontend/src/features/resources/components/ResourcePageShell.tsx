import type { ReactNode } from 'react';
import { StickyPageHeader } from '../../../shared/components/ui/StickyPageHeader';

interface ResourcePageShellProps {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
}

export function ResourcePageShell({ title, description, action, children }: ResourcePageShellProps) {
  return (
    <div className="space-y-6">
      <StickyPageHeader title={title} description={description} action={action} />

      {children}
    </div>
  );
}