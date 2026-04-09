import axios from 'axios';
import api from './client';
import type { ApiErrorResponse } from '../../types/api';
import type {
	BookingApiError,
	BookingApiErrorCode,
	BookingFilters,
	BookingItem,
	CreateBookingRequest,
	ExportBookingsResult,
	ListBookingsParams,
	PaginatedBookingResponse,
	RejectBookingRequest,
} from '../../types/booking';

const messageByStatus: Record<number, string> = {
	400: 'Invalid booking request.',
	403: 'You are not allowed to perform this booking action.',
	404: 'Booking not found.',
	409: 'Booking conflict detected. Please choose a different time slot.',
};

const codeByStatus: Record<number, BookingApiErrorCode> = {
	400: 'BAD_REQUEST',
	403: 'FORBIDDEN',
	404: 'NOT_FOUND',
	409: 'CONFLICT',
};

const getStatusMessage = (status: number): string => {
	return messageByStatus[status] || 'Booking request failed.';
};

export const normalizeBookingApiError = (error: unknown): BookingApiError => {
	if (axios.isAxiosError<ApiErrorResponse>(error)) {
		if (!error.response) {
			return {
				status: null,
				code: 'NETWORK',
				message: 'Server unavailable. Please check your connection and try again.',
				details: error,
			};
		}

		const status = error.response.status;
		return {
			status,
			code: codeByStatus[status] || 'UNKNOWN',
			message: error.response.data?.message || getStatusMessage(status),
			details: error.response.data,
		};
	}

	if (error instanceof Error) {
		return {
			status: null,
			code: 'UNKNOWN',
			message: error.message,
			details: error,
		};
	}

	return {
		status: null,
		code: 'UNKNOWN',
		message: 'Unexpected booking error occurred.',
		details: error,
	};
};

const withBookingErrorHandling = async <T>(request: () => Promise<T>): Promise<T> => {
	try {
		return await request();
	} catch (error: unknown) {
		throw normalizeBookingApiError(error);
	}
};

const buildQueryParams = (filters: BookingFilters = {}) => {
	return {
		status: filters.status || undefined,
		resourceId: filters.resourceId || undefined,
		from: filters.from || undefined,
		to: filters.to || undefined,
	};
};

const extractFilename = (contentDisposition: string | undefined, fallbackName: string): string => {
	if (!contentDisposition) {
		return fallbackName;
	}

	const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
	if (utf8Match?.[1]) {
		return decodeURIComponent(utf8Match[1]);
	}

	const quotedMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
	if (quotedMatch?.[1]) {
		return quotedMatch[1];
	}

	return fallbackName;
};

export const bookingApi = {
	getBookings({ page = 0, size = 10, filters = {} }: ListBookingsParams = {}) {
		return withBookingErrorHandling(async () => {
			const response = await api.get<PaginatedBookingResponse>('/bookings', {
				params: {
					page,
					size,
					...buildQueryParams(filters),
				},
			});
			return response.data;
		});
	},

	getBookingById(id: string) {
		return withBookingErrorHandling(async () => {
			const response = await api.get<BookingItem>(`/bookings/${id}`);
			return response.data;
		});
	},

	createBooking(payload: CreateBookingRequest) {
		return withBookingErrorHandling(async () => {
			const response = await api.post<BookingItem>('/bookings', payload);
			return response.data;
		});
	},

	approveBooking(id: string) {
		return withBookingErrorHandling(async () => {
			const response = await api.put<BookingItem>(`/bookings/${id}/approve`);
			return response.data;
		});
	},

	updateBookingQrFromSummaryImage(id: string, imageDataUrl: string) {
		return withBookingErrorHandling(async () => {
			const response = await api.put<BookingItem>(`/bookings/${id}/qr-from-summary-image`, {
				imageDataUrl,
			});
			return response.data;
		});
	},

	rejectBooking(id: string, payload: RejectBookingRequest) {
		return withBookingErrorHandling(async () => {
			const response = await api.put<BookingItem>(`/bookings/${id}/reject`, payload);
			return response.data;
		});
	},

	cancelBooking(id: string) {
		return withBookingErrorHandling(async () => {
			const response = await api.put<BookingItem>(`/bookings/${id}/cancel`);
			return response.data;
		});
	},

	exportBookingsPdf(filters: BookingFilters = {}) {
		return withBookingErrorHandling(async () => {
			const response = await api.get<Blob>('/bookings/export/pdf', {
				params: buildQueryParams(filters),
				responseType: 'blob',
			});

			return {
				blob: response.data,
				fileName: extractFilename(response.headers['content-disposition'], 'bookings-report.pdf'),
				contentType: response.headers['content-type'] || 'application/pdf',
			} as ExportBookingsResult;
		});
	},

	exportBookingsExcel(filters: BookingFilters = {}) {
		return withBookingErrorHandling(async () => {
			const response = await api.get<Blob>('/bookings/export/excel', {
				params: buildQueryParams(filters),
				responseType: 'blob',
			});

			return {
				blob: response.data,
				fileName: extractFilename(response.headers['content-disposition'], 'bookings-report.xlsx'),
				contentType:
					response.headers['content-type'] ||
					'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			} as ExportBookingsResult;
		});
	},
};

export default bookingApi;
