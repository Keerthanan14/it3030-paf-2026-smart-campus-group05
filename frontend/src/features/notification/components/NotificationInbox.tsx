import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, CheckCheck, Loader2, Inbox } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../../core/api/notificationApi';
import { useNotificationStore } from '../../../core/store/notificationStore';
import { formatRelativeTime } from '../../../core/utils/formatDate';
import { resolveNotificationTarget } from '../../../core/utils/notificationRoutes';
import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { useAuthStore } from '../../../core/store/authStore';
import type { NotificationItem } from '../../../types/notification';
import clsx from 'clsx';

interface NotificationInboxProps {
  title: string;
  description: string;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function NotificationInbox({
  title,
  description,
  pageSize = 10,
  emptyTitle = 'No notifications yet',
  emptyDescription = 'Notifications will appear here once bookings, tickets, or comments are updated.',
}: NotificationInboxProps) {
  const navigate = useNavigate();
  const role = useAuthStore((state) => state.user?.role);
  const syncRecentNotifications = useNotificationStore((state) => state.loadRecentNotifications);
  const markStoreAsRead = useNotificationStore((state) => state.markAsRead);
  const markStoreAllAsRead = useNotificationStore((state) => state.markAllAsRead);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = async (pageNumber = page) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await notificationApi.getNotifications({ page: pageNumber, size: pageSize });
      setNotifications(response.data.content);
      setPage(response.data.page);
      setTotalPages(response.data.totalPages);
      setTotalElements(response.data.totalElements);
      setUnreadCount(response.data.unreadCount);
      await syncRecentNotifications(10);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load notifications');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNotificationClick = async (notification: NotificationItem) => {
    await markStoreAsRead(notification.id);
    setNotifications((current) =>
      current.map((item) => (item.id === notification.id ? { ...item, isRead: true } : item))
    );
    setUnreadCount((current) => Math.max(0, current - 1));
    navigate(resolveNotificationTarget(notification, role));
  };

  const handleMarkAllRead = async () => {
    const updatedCount = await markStoreAllAsRead();
    if (updatedCount > 0) {
      setNotifications((current) => current.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    }
  };

  const hasPrev = page > 0;
  const hasNext = page + 1 < totalPages;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-foreground/70">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-foreground/70">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">{unreadCount} unread</span>
          <span className="rounded-full bg-muted px-3 py-1 font-medium">{totalElements} total</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={handleMarkAllRead} className="gap-2">
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </Button>
        <div className="flex items-center gap-2 text-sm text-foreground/60">
          <span>Page {page + 1} of {Math.max(totalPages, 1)}</span>
        </div>
      </div>

      {isLoading ? (
        <Card className="flex items-center justify-center py-16 text-foreground/60">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading notifications...
        </Card>
      ) : error ? (
        <Card className="border-error/40 bg-error/5 p-6 text-sm text-error">
          {error}
        </Card>
      ) : notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-foreground/50">
            <Inbox className="h-6 w-6" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">{emptyTitle}</p>
            <p className="mt-1 max-w-lg text-sm text-foreground/70">{emptyDescription}</p>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="divide-y divide-border/70">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => handleNotificationClick(notification)}
                className={clsx(
                  'flex w-full items-start gap-4 px-5 py-4 text-left transition hover:bg-muted/60',
                  notification.isRead ? 'bg-transparent' : 'bg-primary/5'
                )}
              >
                <div className={clsx('mt-1 h-3 w-3 shrink-0 rounded-full', notification.isRead ? 'bg-border' : 'bg-primary')} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{notification.message}</p>
                    <span className="text-xs text-foreground/50">{formatRelativeTime(notification.createdAt)}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-foreground/60">
                    <span className="rounded-full bg-muted px-2 py-0.5 font-medium uppercase tracking-wide">
                      {notification.type.replaceAll('_', ' ')}
                    </span>
                    {notification.referenceType && (
                      <span className="rounded-full bg-muted px-2 py-0.5 font-medium uppercase tracking-wide">
                        {notification.referenceType}
                      </span>
                    )}
                    {notification.referenceId && (
                      <span className="rounded-full bg-muted px-2 py-0.5 font-medium tracking-wide">
                        {notification.referenceId.slice(0, 8)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-foreground/30" />
              </button>
            ))}
          </div>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button type="button" variant="outline" disabled={!hasPrev || isLoading} onClick={() => void loadPage(page - 1)} className="gap-2">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button type="button" variant="outline" disabled={!hasNext || isLoading} onClick={() => void loadPage(page + 1)} className="gap-2">
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}