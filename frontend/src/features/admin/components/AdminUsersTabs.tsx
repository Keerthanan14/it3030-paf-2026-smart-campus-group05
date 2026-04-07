import { twMerge } from 'tailwind-merge';
import type { UserTabFilter } from '../../../types/user';

type AdminUsersTabsProps = {
  value: UserTabFilter;
  onChange: (value: UserTabFilter) => void;
};

const tabs: UserTabFilter[] = ['ALL', 'STUDENT', 'STAFF'];

export function AdminUsersTabs({ value, onChange }: AdminUsersTabsProps) {
  return (
    <div className="inline-flex rounded-lg border border-border/70 bg-muted/30 p-1">
      {tabs.map((tab) => {
        const isActive = tab === value;

        return (
          <button
            key={tab}
            type="button"
            onClick={() => onChange(tab)}
            className={twMerge(
              'rounded-md px-4 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-white shadow-sm'
                : 'text-foreground/70 hover:bg-muted hover:text-foreground'
            )}
          >
            {tab === 'ALL' ? 'All' : tab === 'STUDENT' ? 'Student' : 'Staff'}
          </button>
        );
      })}
    </div>
  );
}

export default AdminUsersTabs;
