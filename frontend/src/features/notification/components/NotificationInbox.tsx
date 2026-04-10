import { useEffect, useState } from 'react';
import { CheckCheck, Loader2, Inbox, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../../../core/api/notificationApi';
import { useNotificationStore } from '../../../core/store/notificationStore';
import { formatRelativeTime } from '../../../core/utils/formatDate';
import { resolveNotificationTarget } from '../../../core/utils/notificationRoutes';
import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { StickyPageHeader } from '../../../shared/components/ui/StickyPageHeader';
import { useAuthStore } from '../../../core/store/authStore';
import type { NotificationItem } from '../../../types/notification';
import clsx from 'clsx';

interface NotificationInboxProps {
  title: string;
  description: string;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function NotificationInbox({
  title,
  description,
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
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPage = async (pageNumber = page, size = pageSize) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await notificationApi.getNotifications({ page: pageNumber, size });
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

  const recentNotifications = notifications.slice(0, 3);
  const typeSummary = notifications.reduce<Record<string, number>>((accumulator, notification) => {
    const type = notification.type.replaceAll('_', ' ');
    accumulator[type] = (accumulator[type] ?? 0) + 1;
    return accumulator;
  }, {});
  const topTypes = Object.entries(typeSummary)
    .sort((first, second) => second[1] - first[1])
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <StickyPageHeader
        title={title}
        description={description}
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_450px]">
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={handleMarkAllRead} className="gap-2">
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <span>
                Page {page + 1} of {Math.max(totalPages, 1)}
              </span>
            </div>
          </div>

          {isLoading ? (
            <Card className="flex items-center justify-center py-16 text-foreground/60">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading notifications...
            </Card>
          ) : error ? (
            <Card className="border-error/40 bg-error/5 p-6 text-sm text-error">{error}</Card>
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

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground/70">
              Showing page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} total)
            </p>
            <div className="flex items-center gap-2">
              <select 
                className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm" 
                value={pageSize} 
                onChange={(e) => {
                  const newSize = Number(e.target.value);
                  setPageSize(newSize);
                  setPage(0);
                  void loadPage(0, newSize);
                }}
              >
                <option value={5}>5 / page</option>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
              </select>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => void loadPage(page - 1)} 
                disabled={page <= 0 || isLoading}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => void loadPage(page + 1)}
                disabled={isLoading || totalPages === 0 || page >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/55">At a glance</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-primary/5 p-4">
                <p className="text-xs text-foreground/60">Unread</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{unreadCount}</p>
              </div>
              <div className="rounded-2xl bg-muted/60 p-4">
                <p className="text-xs text-foreground/60">Total</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{totalElements}</p>
              </div>
            </div>
            <div className="mt-4 rounded-2xl border border-border/60 bg-background/80 p-4 text-sm text-foreground/70">
              Most activity comes from booking and ticket updates. Open any item to jump to the related page.
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/55">Recent activity</p>
            <div className="mt-4 space-y-3">
              {recentNotifications.length > 0 ? (
                recentNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className="flex w-full items-start gap-3 rounded-2xl border border-border/60 bg-background/80 p-3 text-left transition hover:bg-muted/50"
                  >
                    <div className={clsx('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', notification.isRead ? 'bg-border' : 'bg-primary')} />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-medium text-foreground">{notification.message}</p>
                      <p className="mt-1 text-xs text-foreground/50">{formatRelativeTime(notification.createdAt)}</p>
                    </div>
                  </button>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-foreground/60">
                  New notifications will appear here.
                </p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/55">Top types</p>
            <div className="mt-4 space-y-2">
              {topTypes.length > 0 ? (
                topTypes.map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3 text-sm">
                    <span className="font-medium text-foreground">{type}</span>
                    <span className="rounded-full bg-background px-2.5 py-0.5 text-xs font-semibold text-foreground/70">{count}</span>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-dashed border-border/60 p-4 text-sm text-foreground/60">
                  No notification types yet.
                </p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}