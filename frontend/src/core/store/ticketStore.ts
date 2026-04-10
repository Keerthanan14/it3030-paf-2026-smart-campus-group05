import { create } from "zustand";
import type { TicketFilters } from "../../types/ticket";

type TicketStoreState = {
	filters: TicketFilters;
	page: number;
	size: number;
	totalPages: number;
	totalElements: number;
	selectedTicketId: string | null;
	setFilters: (filters: TicketFilters) => void;
	patchFilters: (partial: Partial<TicketFilters>) => void;
	resetFilters: () => void;
	setPage: (page: number) => void;
	setSize: (size: number) => void;
	setPaginationMeta: (totalPages: number, totalElements: number) => void;
	setSelectedTicketId: (ticketId: string | null) => void;
	resetPagination: () => void;
};

const defaultFilters: TicketFilters = {};

export const useTicketStore = create<TicketStoreState>((set) => ({
	filters: defaultFilters,
	page: 0,
	size: 5,
	totalPages: 0,
	totalElements: 0,
	selectedTicketId: null,

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

	setPaginationMeta: (totalPages, totalElements) =>
		set({
			totalPages: Math.max(0, totalPages),
			totalElements: Math.max(0, totalElements),
		}),

	setSelectedTicketId: (ticketId) =>
		set({
			selectedTicketId: ticketId,
		}),

	resetPagination: () =>
		set({
			page: 0,
			size: 5,
			totalPages: 0,
			totalElements: 0,
		}),
}));

