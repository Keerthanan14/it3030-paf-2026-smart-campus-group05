export type NotificationType =
	| 'BOOKING_CREATED'
	| 'BOOKING_APPROVED'
	| 'BOOKING_REJECTED'
	| 'BOOKING_CANCELLED'
	| 'TICKET_CREATED'
	| 'TICKET_STATUS_CHANGE'
	| 'NEW_COMMENT'
	| string;

export type NotificationReferenceType = 'BOOKING' | 'TICKET' | string;

export interface NotificationItem {
	id: string;
	type: NotificationType;
	message: string;
	isRead: boolean;
	referenceId: string | null;
	referenceType: NotificationReferenceType | null;
	createdAt: string;
}

export interface PaginatedNotificationResponse {
	content: NotificationItem[];
	page: number;
	size: number;
	totalElements: number;
	totalPages: number;
	last: boolean;
	unreadCount: number;
}

export interface NotificationUpdateResponse {
	message: string;
	updatedCount: number;
}

export interface NotificationQueryParams {
	unreadOnly?: boolean;
	page?: number;
	size?: number;
}
