import { NavLink, useLocation } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import clsx from 'clsx';

export interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

interface SidebarProps {
  navigation: NavigationItem[];
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Sidebar({
  navigation,
  isSidebarOpen,
  onToggleSidebar,
}: SidebarProps) {
  const location = useLocation();

  const isItemActive = (href: string) => {
    const path = location.pathname;

    if (href === '/admin/resources/browse') {
      return path.startsWith('/admin/resources/browse');
    }

    if (href === '/admin/resources') {
      return path === '/admin/resources' || path === '/admin/resources/new' || /^\/admin\/resources\/[^/]+\/edit$/.test(path);
    }

    return path === href || path.startsWith(`${href}/`);
  };

  return (
    <div
      className={clsx(
        'hidden lg:fixed lg:left-0 lg:top-16 lg:bottom-0 lg:z-30 lg:flex lg:flex-col transition-[width] duration-200',
        isSidebarOpen ? 'lg:w-72' : 'lg:w-20'
      )}
    >
      <div className={clsx(
        'flex grow flex-col overflow-y-auto bg-background border-r border-border pb-4',
        isSidebarOpen ? 'px-4' : 'px-3'
      )}>
        <div className="flex h-14 shrink-0 items-center justify-end border-b border-border/70">
          {isSidebarOpen && (
            <span className="mr-auto px-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">Navigation</span>
          )}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="h-9 w-9 rounded-lg text-foreground/70 hover:bg-primary/10 hover:text-primary flex items-center justify-center"
            aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isSidebarOpen ? <ChevronsLeft className="h-5 w-5" /> : <ChevronsRight className="h-5 w-5" />}
          </button>
        </div>

        <div className="pt-3" />

        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            <li>
              <ul role="list" className={clsx('space-y-1', isSidebarOpen ? 'mx-0' : 'mx-auto w-full')}>
                {navigation.map((item) => (
                  <li key={item.name}>
                    {(() => {
                      const isActive = isItemActive(item.href);
                      return (
                    <NavLink
                      to={item.href}
                      className={
                        clsx(
                          isActive
                            ? 'bg-primary text-primary-foreground'
                            : 'text-foreground/75 hover:text-primary hover:bg-primary/10',
                          'group rounded-md text-sm leading-6 font-semibold transition-colors',
                          isSidebarOpen ? 'flex gap-x-3 p-2' : 'flex justify-center p-2'
                        )
                      }
                      title={item.name}
                    >
                      <>
                        <item.icon
                          className={clsx(
                            isActive ? 'text-primary-foreground' : 'text-foreground/70 group-hover:text-primary',
                            'h-6 w-6 shrink-0'
                          )}
                          aria-hidden="true"
                        />
                        {isSidebarOpen && item.name}
                      </>
                    </NavLink>
                      );
                    })()}
                  </li>
                ))}
              </ul>
            </li>

          </ul>
        </nav>
      </div>
    </div>
  );
}
