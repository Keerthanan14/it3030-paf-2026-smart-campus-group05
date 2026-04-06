import { useEffect, useRef } from 'react';
import { TOKEN_KEY, useAuthStore } from '../../../core/store/authStore';
import { useNotificationStore } from '../../../core/store/notificationStore';
import { notificationSocketService } from '../services/notificationSocket';
import { useToast } from '../../../shared/components/ui/useToast';

export function NotificationRealtimeBridge() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const loadRecentNotifications = useNotificationStore((state) => state.loadRecentNotifications);
  const upsertNotification = useNotificationStore((state) => state.upsertNotification);
  const clearNotifications = useNotificationStore((state) => state.clearNotifications);
  const toast = useToast();
  const toastIds = useRef<Set<string>>(new Set());
  const token = window.localStorage.getItem(TOKEN_KEY);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      notificationSocketService.disconnect();
      clearNotifications();
      return;
    }

    void loadRecentNotifications(10);

    notificationSocketService.connect(token, {
      onNotification: (notification) => {
        upsertNotification(notification);

        if (!notification.isRead && !toastIds.current.has(notification.id)) {
          toastIds.current.add(notification.id);
          toast.info('New notification', notification.message);
        }
      },
      onError: (message) => {
        toast.warning('Notification connection issue', message);
      },
    });

    return () => {
      notificationSocketService.disconnect();
    };
  }, [clearNotifications, isAuthenticated, loadRecentNotifications, token, toast, upsertNotification]);

  return null;
}