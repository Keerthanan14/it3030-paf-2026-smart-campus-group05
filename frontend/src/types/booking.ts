export type BookingStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface BookingLinks {
	self?: { href: string };
	approve?: { href: string };
	reject?: { href: string };
	cancel?: { href: string };
	[key: string]: { href: string } | undefined;
}

export interface BookingItem {
	id: string;
	userId: string;
	userName: string;
	resourceId: string;
	resourceName: string;
	bookingDate: string;
	startTime: string;
	endTime: string;
	purpose: string;
	attendeesCount: number;
	status: BookingStatus;
	rejectionReason: string | null;
	qrCodeUrl: string | null;
	createdAt: string;
	updatedAt: string;
	_links?: BookingLinks;
}

export interface PaginatedBookingResponse {
	content: BookingItem[];
	totalElements: number;
	totalPages: number;
	currentPage: number;
	size: number;
}

export interface CreateBookingRequest {
	resourceId: string;
	bookingDate: string;
	startTime: string;
	endTime: string;
	purpose: string;
	attendeesCount: number;
}

export interface RejectBookingRequest {
	rejectionReason: string;
}

export interface BookingFilters {
	status?: BookingStatus;
	resourceId?: string;
	from?: string;
	to?: string;
}

export interface ListBookingsParams {
	page?: number;
	size?: number;
	filters?: BookingFilters;
}

export interface ExportBookingsResult {
	blob: Blob;
	fileName: string;
	contentType: string;
}

export type BookingApiErrorCode =
	| 'BAD_REQUEST'
	| 'FORBIDDEN'
	| 'NOT_FOUND'
	| 'CONFLICT'
	| 'NETWORK'
	| 'UNKNOWN';

export interface BookingApiError {
	status: number | null;
	code: BookingApiErrorCode;
	message: string;
	details?: unknown;
}
