import { create } from 'zustand';
import { notificationApi } from '../api/notificationApi';
import type { NotificationItem } from '../../types/notification';

interface NotificationStoreState {
	notifications: NotificationItem[];
	unreadCount: number;
	isLoading: boolean;
	error: string | null;
	hasLoaded: boolean;
	loadRecentNotifications: (size?: number, unreadOnly?: boolean) => Promise<void>;
	markAsRead: (notificationId: string) => Promise<NotificationItem | null>;
	markAllAsRead: () => Promise<number>;
	upsertNotification: (notification: NotificationItem) => void;
	clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationStoreState>((set) => ({
	notifications: [],
	unreadCount: 0,
	isLoading: false,
	error: null,
	hasLoaded: false,

	loadRecentNotifications: async (size = 5, unreadOnly = false) => {
		set({ isLoading: true, error: null });

		try {
			const response = await notificationApi.getNotifications({ size, page: 0, unreadOnly });
			set({
				notifications: response.data.content,
				unreadCount: response.data.unreadCount,
				isLoading: false,
				hasLoaded: true,
			});
		} catch (error) {
			set({
				isLoading: false,
				error: error instanceof Error ? error.message : 'Failed to load notifications',
			});
		}
	},

	markAsRead: async (notificationId: string) => {
		try {
			const response = await notificationApi.markAsRead(notificationId);
			const updatedNotification = response.data;

			set((state) => ({
				notifications: state.notifications.map((item) =>
					item.id === updatedNotification.id ? updatedNotification : item
				),
				unreadCount: Math.max(0, state.unreadCount - (updatedNotification.isRead ? 1 : 0)),
			}));

			return updatedNotification;
		} catch (error) {
			set({
				error: error instanceof Error ? error.message : 'Failed to update notification',
			});
			return null;
		}
	},

	markAllAsRead: async () => {
		try {
			const response = await notificationApi.markAllAsRead();
			const updatedCount = response.data.updatedCount;

			set((state) => ({
				notifications: state.notifications.map((item) => ({ ...item, isRead: true })),
				unreadCount: 0,
			}));

			return updatedCount;
		} catch (error) {
			set({
				error: error instanceof Error ? error.message : 'Failed to mark notifications as read',
			});
			return 0;
		}
	},

	upsertNotification: (notification: NotificationItem) => {
		set((state) => {
			const existingIndex = state.notifications.findIndex((item) => item.id === notification.id);

			if (existingIndex >= 0) {
				const notifications = [...state.notifications];
				notifications[existingIndex] = notification;
				return { notifications };
			}

			return {
				notifications: [notification, ...state.notifications].slice(0, 10),
				unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
			};
		});
	},

	clearNotifications: () => {
		set({ notifications: [], unreadCount: 0, isLoading: false, error: null, hasLoaded: false });
	},
}));
