import { create } from 'zustand';
import bookingApi from '../api/bookingApi';
import type {
	BookingApiError,
	BookingFilters,
	BookingItem,
	CreateBookingRequest,
	RejectBookingRequest,
} from '../../types/booking';

type BookingStoreState = {
	items: BookingItem[];
	selectedBooking: BookingItem | null;
	filters: BookingFilters;
	page: number;
	size: number;
	totalPages: number;
	totalElements: number;
	isListLoading: boolean;
	isDetailLoading: boolean;
	isMutating: boolean;
	isExportingPdf: boolean;
	isExportingExcel: boolean;
	error: BookingApiError | null;
	setFilters: (filters: BookingFilters) => void;
	patchFilters: (partial: Partial<BookingFilters>) => void;
	resetFilters: () => void;
	setPage: (page: number) => void;
	setSize: (size: number) => void;
	setSelectedBooking: (booking: BookingItem | null) => void;
	clearError: () => void;
	fetchBookings: () => Promise<void>;
	fetchBookingById: (id: string) => Promise<BookingItem | null>;
	createBooking: (payload: CreateBookingRequest) => Promise<BookingItem>;
	approveBooking: (id: string) => Promise<BookingItem>;
	rejectBooking: (id: string, payload: RejectBookingRequest) => Promise<BookingItem>;
	cancelBooking: (id: string) => Promise<BookingItem>;
	exportBookingsPdf: () => Promise<void>;
	exportBookingsExcel: () => Promise<void>;
};

const defaultFilters: BookingFilters = {};

const toBookingError = (error: unknown): BookingApiError => {
	if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
		return error as BookingApiError;
	}

	return {
		status: null,
		code: 'UNKNOWN',
		message: 'Unexpected booking error occurred.',
		details: error,
	};
};

const triggerFileDownload = (blob: Blob, fileName: string): void => {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
};

export const useBookingStore = create<BookingStoreState>((set, get) => ({
	items: [],
	selectedBooking: null,
	filters: defaultFilters,
	page: 0,
	size: 5,
	totalPages: 0,
	totalElements: 0,
	isListLoading: false,
	isDetailLoading: false,
	isMutating: false,
	isExportingPdf: false,
	isExportingExcel: false,
	error: null,

	setFilters: (filters) =>
		set({
			filters,
			page: 0,
		}),

	patchFilters: (partial) =>
		set((state) => ({
			filters: {
				...state.filters,
				...partial,
			},
			page: 0,
		})),

	resetFilters: () =>
		set({
			filters: defaultFilters,
			page: 0,
		}),

	setPage: (page) =>
		set({
			page: Math.max(0, page),
		}),

	setSize: (size) =>
		set({
			size: Math.max(1, size),
			page: 0,
		}),

	setSelectedBooking: (booking) =>
		set({
			selectedBooking: booking,
		}),

	clearError: () =>
		set({
			error: null,
		}),

	fetchBookings: async () => {
		const { page, size, filters } = get();
		set({ isListLoading: true, error: null });
		try {
			const response = await bookingApi.getBookings({ page, size, filters });
			set({
				items: response.content,
				totalPages: response.totalPages,
				totalElements: response.totalElements,
				isListLoading: false,
			});
		} catch (error: unknown) {
			set({
				error: toBookingError(error),
				isListLoading: false,
			});
		}
	},

	fetchBookingById: async (id) => {
		set({ isDetailLoading: true, error: null });
		try {
			const booking = await bookingApi.getBookingById(id);
			set({
				selectedBooking: booking,
				isDetailLoading: false,
			});
			return booking;
		} catch (error: unknown) {
			set({
				error: toBookingError(error),
				isDetailLoading: false,
			});
			return null;
		}
	},

	createBooking: async (payload) => {
		set({ isMutating: true, error: null });
		try {
			const created = await bookingApi.createBooking(payload);
			set({
				items: [created, ...get().items],
				selectedBooking: created,
				isMutating: false,
			});
			return created;
		} catch (error: unknown) {
			const normalized = toBookingError(error);
			set({ error: normalized, isMutating: false });
			throw normalized;
		}
	},

	approveBooking: async (id) => {
		set({ isMutating: true, error: null });
		try {
			const updated = await bookingApi.approveBooking(id);
			set((state) => ({
				items: state.items.map((item) => (item.id === id ? updated : item)),
				selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
				isMutating: false,
			}));
			return updated;
		} catch (error: unknown) {
			const normalized = toBookingError(error);
			set({ error: normalized, isMutating: false });
			throw normalized;
		}
	},

	rejectBooking: async (id, payload) => {
		set({ isMutating: true, error: null });
		try {
			const updated = await bookingApi.rejectBooking(id, payload);
			set((state) => ({
				items: state.items.map((item) => (item.id === id ? updated : item)),
				selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
				isMutating: false,
			}));
			return updated;
		} catch (error: unknown) {
			const normalized = toBookingError(error);
			set({ error: normalized, isMutating: false });
			throw normalized;
		}
	},

	cancelBooking: async (id) => {
		set({ isMutating: true, error: null });
		try {
			const updated = await bookingApi.cancelBooking(id);
			set((state) => ({
				items: state.items.map((item) => (item.id === id ? updated : item)),
				selectedBooking: state.selectedBooking?.id === id ? updated : state.selectedBooking,
				isMutating: false,
			}));
			return updated;
		} catch (error: unknown) {
			const normalized = toBookingError(error);
			set({ error: normalized, isMutating: false });
			throw normalized;
		}
	},

	exportBookingsPdf: async () => {
		set({ isExportingPdf: true, error: null });
		try {
			const { filters } = get();
			const result = await bookingApi.exportBookingsPdf(filters);
			triggerFileDownload(result.blob, result.fileName);
			set({ isExportingPdf: false });
		} catch (error: unknown) {
			set({
				error: toBookingError(error),
				isExportingPdf: false,
			});
		}
	},

	exportBookingsExcel: async () => {
		set({ isExportingExcel: true, error: null });
		try {
			const { filters } = get();
			const result = await bookingApi.exportBookingsExcel(filters);
			triggerFileDownload(result.blob, result.fileName);
			set({ isExportingExcel: false });
		} catch (error: unknown) {
			set({
				error: toBookingError(error),
				isExportingExcel: false,
			});
		}
	},
}));
