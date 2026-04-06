import api from './client';
import type {
	NotificationItem,
	NotificationQueryParams,
	NotificationUpdateResponse,
	PaginatedNotificationResponse,
} from '../../types/notification';

export const notificationApi = {
	getNotifications(params: NotificationQueryParams = {}) {
		return api.get<PaginatedNotificationResponse>('/notifications', {
			params: {
				unreadOnly: params.unreadOnly ?? false,
				page: params.page ?? 0,
				size: params.size ?? 20,
			},
		});
	},

	markAsRead(notificationId: string) {
		return api.put<NotificationItem>(`/notifications/${notificationId}/read`);
	},

	markAllAsRead() {
		return api.put<NotificationUpdateResponse>('/notifications/read-all');
	},
};
