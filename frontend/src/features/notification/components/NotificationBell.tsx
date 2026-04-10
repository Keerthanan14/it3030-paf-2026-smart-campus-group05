import { useEffect, useRef, useState } from 'react';
import { Bell, CheckCheck, ChevronRight, CircleAlert, MessageSquare, Ticket, CalendarClock, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../../../core/store/notificationStore';
import { formatRelativeTime } from '../../../core/utils/formatDate';
import { resolveNotificationTarget } from '../../../core/utils/notificationRoutes';
import type { UserRole } from '../../../types/auth';
import type { NotificationItem } from '../../../types/notification';
import clsx from 'clsx';

interface NotificationBellProps {
  role: UserRole | string | null | undefined;
}

function getNotificationIcon(notification: NotificationItem) {
  const iconClass = 'h-4 w-4';

  if (
    notification.type === 'BOOKING_CREATED' ||
    notification.type === 'BOOKING_APPROVED' ||
    notification.type === 'BOOKING_REJECTED' ||
    notification.type === 'BOOKING_CANCELLED'
  ) {
    return <CalendarClock className={iconClass} />;
  }

  if (notification.type === 'TICKET_CREATED' || notification.type === 'TICKET_STATUS_CHANGE') {
    return <Ticket className={iconClass} />;
  }

  if (notification.type === 'NEW_COMMENT') {
    return <MessageSquare className={iconClass} />;
  }

  return <CircleAlert className={iconClass} />;
}

export function NotificationBell({ role }: NotificationBellProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const notifications = useNotificationStore((state) => state.notifications);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const isLoading = useNotificationStore((state) => state.isLoading);
  const hasLoaded = useNotificationStore((state) => state.hasLoaded);
  const loadRecentNotifications = useNotificationStore((state) => state.loadRecentNotifications);
  const markAsRead = useNotificationStore((state) => state.markAsRead);
  const markAllAsRead = useNotificationStore((state) => state.markAllAsRead);

  useEffect(() => {
    if (!hasLoaded) {
      void loadRecentNotifications(10);
    }
  }, [hasLoaded, loadRecentNotifications]);

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onEscape);

    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const handleNotificationClick = async (notification: NotificationItem) => {
    await markAsRead(notification.id);
    setIsOpen(false);
    navigate(resolveNotificationTarget(notification, role));
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative -m-2.5 rounded-full p-2.5 text-foreground/60 transition hover:bg-muted hover:text-foreground"
        aria-label="Open notifications"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <span className="sr-only">View notifications</span>
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 z-50 w-[22rem] overflow-hidden rounded-2xl border border-border bg-background shadow-xl ring-1 ring-black/5">
          <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">Notifications</p>
              <p className="text-xs text-foreground/60">Latest updates from bookings and tickets</p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          </div>

          <div className="max-h-[26rem] overflow-y-auto">
            {isLoading && notifications.length === 0 ? (
              <div className="flex items-center justify-center px-4 py-10 text-foreground/60">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-medium text-foreground">No notifications yet</p>
                <p className="mt-1 text-xs text-foreground/60">You will see booking and ticket updates here.</p>
              </div>
            ) : (
              <div className="p-2">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={clsx(
                      'flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-muted/70',
                      notification.isRead ? 'bg-transparent' : 'bg-primary/5'
                    )}
                  >
                    <div className={clsx('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', notification.isRead ? 'bg-muted text-foreground/60' : 'bg-primary/10 text-primary')}>
                      {getNotificationIcon(notification)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={clsx('truncate text-sm font-semibold', notification.isRead ? 'text-foreground/80' : 'text-foreground')}>
                          {notification.message}
                        </p>
                        <span className="whitespace-nowrap text-[11px] text-foreground/50">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-foreground/60">
                        <span className="rounded-full bg-muted px-2 py-0.5 font-medium uppercase tracking-wide">
                          {notification.type.replaceAll('_', ' ')}
                        </span>
                        {notification.referenceType && (
                          <span className="rounded-full bg-muted px-2 py-0.5 font-medium uppercase tracking-wide">
                            {notification.referenceType}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-foreground/40" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border/70 px-4 py-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate(resolveNotificationTarget({ referenceType: null, referenceId: null }, role));
              }}
              className="w-full rounded-xl bg-muted px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted/80"
            >
              View notifications page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}