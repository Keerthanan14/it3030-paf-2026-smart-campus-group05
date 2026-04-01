import { useEffect, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, Calendar, LayoutDashboard, Ticket, Bell, Settings, UserCircle, ChevronsLeft, ChevronsRight } from 'lucide-react';
import clsx from 'clsx';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuthStore } from '../../core/store/authStore';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const roleFromStore = (user?.role ?? '').replace('ROLE_', '').toLowerCase();
  const roleFromPath = location.pathname.startsWith('/admin')
    ? 'admin'
    : location.pathname.startsWith('/technician')
      ? 'technician'
      : location.pathname.startsWith('/student')
        ? 'student'
        : 'student';

  const activeRole = roleFromStore || roleFromPath;
  const displayName = user?.name || 'Campus User';
  const profileImage = user?.profilePicture?.trim() || '';
  const displayEmail = user?.email || 'No email available';
  const roleLabel = activeRole.charAt(0).toUpperCase() + activeRole.slice(1);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (!profileMenuRef.current) {
        return;
      }
      if (!profileMenuRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
    };
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const getNavigation = (role: string) => {
    const nav = [
      { name: 'Dashboard', href: `/${role}/dashboard`, icon: LayoutDashboard },
    ];

    if (role === 'admin') {
      nav.push(
        { name: 'Resources', href: '/admin/resources', icon: Home },
        { name: 'Incidents', href: '/admin/tickets', icon: Ticket },
        { name: 'System Settings', href: '/admin/settings', icon: Settings }
      );
    } else if (role === 'student' || role === 'staff') {
      nav.push(
        { name: 'My Bookings', href: '/booking', icon: Calendar },
        { name: 'My Tickets', href: '/ticket', icon: Ticket },
        { name: 'Notifications', href: '/student/notifications', icon: Bell },
        { name: 'Settings', href: '/student/settings', icon: Settings }
      );
    } else if (role === 'technician') {
      nav.push(
        { name: 'Assigned Tickets', href: '/technician/tickets', icon: Ticket }
      );
    }

    return nav;
  };

  const navigation = getNavigation(activeRole);

  return (
    <div className="min-h-screen bg-background">
      {/* Top Header */}
      <div className="fixed inset-x-0 top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:px-6 lg:px-8">
        <div className="flex items-center">
          <span className="text-xl font-bold text-foreground tracking-wide">SmartCampus</span>
        </div>
        <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
          <div className="flex items-center gap-x-4 lg:gap-x-6">
            <ThemeToggle />

            <button type="button" className="-m-2.5 p-2.5 text-foreground/50 hover:text-foreground/80 relative">
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
              <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-error ring-2 ring-background"></span>
            </button>

            <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

            <div ref={profileMenuRef} className="relative flex items-center gap-x-3">
              <span className="hidden lg:flex lg:items-center text-sm font-semibold leading-6 text-foreground">
                👋 Welcome, {displayName}
              </span>

              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="h-9 w-9 overflow-hidden rounded-full border border-border bg-muted/40 flex items-center justify-center hover:border-primary/50"
                aria-label="Open profile menu"
                aria-haspopup="menu"
                aria-expanded={isProfileMenuOpen}
              >
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt="User profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UserCircle className="h-7 w-7 text-foreground/60" />
                )}
              </button>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-border bg-background p-4 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 overflow-hidden rounded-full border border-border bg-muted/40 flex items-center justify-center">
                      {profileImage ? (
                        <img
                          src={profileImage}
                          alt="User profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserCircle className="h-10 w-10 text-foreground/60" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                      <p className="truncate text-xs text-foreground/70">{displayEmail}</p>
                      <p className="mt-1 inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                        {roleLabel}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex pt-16">
      {/* Sidebar sidebar */}
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
              onClick={() => setIsSidebarOpen((prev) => !prev)}
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
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
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
                        {({ isActive }) => (
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
                        )}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="mt-auto">
                <button
                  onClick={handleLogout}
                  className={clsx(
                    'group w-full rounded-md p-2 text-sm font-semibold leading-6 text-foreground/75 hover:bg-primary/10 hover:text-primary transition-colors',
                    isSidebarOpen ? 'flex gap-x-3' : 'flex justify-center'
                  )}
                  title="Log out"
                >
                  <LogOut className="h-6 w-6 shrink-0 text-foreground/70 group-hover:text-primary" aria-hidden="true" />
                  {isSidebarOpen && 'Log out'}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className={clsx('flex flex-col flex-1 transition-[padding-left] duration-200', isSidebarOpen ? 'lg:pl-72' : 'lg:pl-20')}>
        <main className="py-10 flex-1">
          <div className="px-4 sm:px-6 lg:px-8 text-foreground">
            <Outlet />
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}
