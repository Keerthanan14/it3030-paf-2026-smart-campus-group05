import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Calendar, LayoutDashboard, Ticket, Bell, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useAuthStore } from '../../core/store/authStore';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar, type NavigationItem } from '../components/layout/Sidebar';

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const roleFromStore = (user?.role ?? '').replace('ROLE_', '').toLowerCase();
  const roleFromPath = location.pathname.startsWith('/admin')
    ? 'admin'
    : location.pathname.startsWith('/technician')
      ? 'technician'
      : location.pathname.startsWith('/student')
        ? 'student'
        : 'student';

  const activeRole = roleFromStore || roleFromPath;
  
  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const getNavigation = (role: string): NavigationItem[] => {
    const nav: NavigationItem[] = [
      { name: 'Dashboard', href: `/${role}/dashboard`, icon: LayoutDashboard },
    ];

    if (role === 'admin') {
      nav.push(
        { name: 'Browse Resources', href: '/admin/resources/browse', icon: Calendar },
        { name: 'Resources', href: '/admin/resources', icon: Home },
        { name: 'Bookings', href: '/admin/bookings', icon: Calendar },
        { name: 'System Settings', href: '/admin/settings', icon: Settings }
      );
    } else if (role === 'student' || role === 'staff') {
      nav.push(
        { name: 'Resources', href: '/student/resources', icon: Home },
        { name: 'My Bookings', href: '/student/booking', icon: Calendar },
        { name: 'My Tickets', href: '/student/tickets', icon: Ticket },
        { name: 'Notifications', href: '/student/notifications', icon: Bell },
        { name: 'Settings', href: '/student/settings', icon: Settings }
      );
    } else if (role === 'technician') {
      nav.push(
        { name: 'Resources', href: '/technician/resources', icon: Home }
      );
    }

    return nav;
  };

  const navigation = getNavigation(activeRole);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} activeRole={activeRole} />

      <div className="flex pt-16">
        <Sidebar
          navigation={navigation}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          onLogout={handleLogout}
        />

      <div className={clsx('flex flex-col flex-1 transition-[padding-left] duration-200', isSidebarOpen ? 'lg:pl-72' : 'lg:pl-20')}>
        <main className="py-2 flex-1">
          <div key={location.pathname} className="px-4 sm:px-6 lg:px-8 text-foreground">
            <Outlet />
          </div>
        </main>
      </div>
      </div>
    </div>
  );
}
