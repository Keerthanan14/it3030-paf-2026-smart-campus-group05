import { useEffect, useRef, useState } from 'react';
import { Bell, UserCircle } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import type { AuthUser } from '../../../types/auth';

interface NavbarProps {
  user: AuthUser | null;
  activeRole: string;
}

export function Navbar({ user, activeRole }: NavbarProps) {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement | null>(null);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);

  const notifications = [
    {
      id: 1,
      title: 'Ticket Updated',
      message: 'Your maintenance ticket #SC-104 is now in progress.',
      time: '2m ago',
      unread: true,
    },
    {
      id: 2,
      title: 'Booking Confirmed',
      message: 'Computer Lab A booking is confirmed for tomorrow at 10:00 AM.',
      time: '1h ago',
      unread: true,
    },
    {
      id: 3,
      title: 'System Notice',
      message: 'Planned maintenance starts at 11:00 PM tonight.',
      time: 'Yesterday',
      unread: false,
    },
  ];
  const unreadCount = notifications.filter((item) => item.unread).length;

  const displayName = user?.name || 'Campus User';
  const profileImage = user?.profilePicture?.trim() || '';
  const displayEmail = user?.email || 'No email available';
  const roleLabel = activeRole.charAt(0).toUpperCase() + activeRole.slice(1);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const targetNode = event.target as Node;

      if (notificationMenuRef.current && !notificationMenuRef.current.contains(targetNode)) {
        setIsNotificationOpen(false);
      }

      if (profileMenuRef.current && !profileMenuRef.current.contains(targetNode)) {
        setIsProfileMenuOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsNotificationOpen(false);
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-40 flex h-16 shrink-0 items-center justify-between gap-x-4 border-b border-border bg-background px-4 shadow-sm sm:px-6 lg:px-8">
      <div className="flex items-center">
        <span className="text-xl font-bold text-foreground tracking-wide">SmartCampus</span>
      </div>
      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6 justify-end">
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <ThemeToggle />

          <div ref={notificationMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationOpen((prev) => !prev)}
              className="-m-2.5 p-2.5 text-foreground/50 hover:text-foreground/80 relative"
              aria-label="Open notifications"
              aria-haspopup="menu"
              aria-expanded={isNotificationOpen}
            >
              <span className="sr-only">View notifications</span>
              <Bell className="h-6 w-6" aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white ring-2 ring-background">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotificationOpen && (
              <div className="absolute right-0 top-12 z-50 w-80 rounded-lg border border-border bg-background p-3 shadow-lg">
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Notifications</p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {unreadCount} new
                  </span>
                </div>

                <div className="space-y-2">
                  {notifications.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setIsNotificationOpen(false)}
                      className="w-full rounded-md border border-border/70 p-3 text-left hover:bg-muted/50"
                    >
                      <div className="mb-1 flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <span className="text-[11px] text-foreground/60">{item.time}</span>
                      </div>
                      <p className="text-xs text-foreground/75">{item.message}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

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
  );
}
