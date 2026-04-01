import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Home, Calendar, LayoutDashboard, Ticket, Bell, Settings, UserCircle } from 'lucide-react';
import clsx from 'clsx';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuthStore } from '../../core/store/authStore';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

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
        { name: 'My Tickets', href: '/ticket', icon: Ticket }
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
    <div className="min-h-screen bg-background flex">
      {/* Sidebar sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-primary px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <span className="text-2xl font-bold text-primary-foreground tracking-wide">SmartCampus</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <NavLink
                        to={item.href}
                        className={({ isActive }) =>
                          clsx(
                            isActive
                              ? 'bg-secondary text-primary-foreground'
                              : 'text-primary-foreground/80 hover:text-primary-foreground hover:bg-secondary/50',
                            'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors'
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              className={clsx(
                                isActive ? 'text-primary-foreground' : 'text-primary-foreground/70 group-hover:text-primary-foreground',
                                'h-6 w-6 shrink-0'
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
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
                  className="group -mx-2 flex w-full gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-primary-foreground/80 hover:bg-secondary/50 hover:text-primary-foreground transition-colors"
                >
                  <LogOut className="h-6 w-6 shrink-0 text-primary-foreground/70 group-hover:text-primary-foreground" aria-hidden="true" />
                  Log out
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72 flex flex-col flex-1">
        {/* Top Header */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:px-6 lg:px-8">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              
              <ThemeToggle />

              <button type="button" className="-m-2.5 p-2.5 text-foreground/50 hover:text-foreground/80 relative">
                <span className="sr-only">View notifications</span>
                <Bell className="h-6 w-6" aria-hidden="true" />
                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-error ring-2 ring-background"></span>
              </button>

              <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border" aria-hidden="true" />

              <div className="flex items-center gap-x-4">
                <span className="hidden lg:flex lg:items-center">
                  <span className="ml-4 text-sm font-semibold leading-6 text-foreground" aria-hidden="true">
                    {displayName}
                  </span>
                </span>
                <UserCircle className="h-8 w-8 text-foreground/50" />
              </div>
            </div>
          </div>
        </div>

        <main className="py-10 flex-1">
          <div className="px-4 sm:px-6 lg:px-8 text-foreground">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
