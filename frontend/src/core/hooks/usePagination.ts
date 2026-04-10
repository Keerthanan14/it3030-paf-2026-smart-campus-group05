import { useMemo, useState } from "react";

type UsePaginationOptions = {
	initialPage?: number;
	initialPageSize?: number;
	totalItems?: number;
};

export type UsePaginationResult = {
	page: number;
	pageSize: number;
	totalItems: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	offset: number;
	setPage: (nextPage: number) => void;
	setPageSize: (nextSize: number) => void;
	nextPage: () => void;
	previousPage: () => void;
	reset: () => void;
	setTotalItems: (nextTotal: number) => void;
};

const clamp = (value: number, min: number, max: number): number => {
	if (value < min) return min;
	if (value > max) return max;
	return value;
};

/**
 * Generic pagination state helper for server-side or client-side paged lists.
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationResult {
	const initialPage = options.initialPage ?? 0;
	const initialPageSize = options.initialPageSize ?? 5;
	const [page, setPageState] = useState<number>(Math.max(0, initialPage));
	const [pageSize, setPageSizeState] = useState<number>(Math.max(1, initialPageSize));
	const [totalItems, setTotalItemsState] = useState<number>(Math.max(0, options.totalItems ?? 0));

	const totalPages = useMemo(() => {
		if (totalItems <= 0) return 0;
		return Math.ceil(totalItems / pageSize);
	}, [totalItems, pageSize]);

	const maxPageIndex = useMemo(() => {
		if (totalPages <= 0) return 0;
		return totalPages - 1;
	}, [totalPages]);

	const safePage = useMemo(() => clamp(page, 0, maxPageIndex), [page, maxPageIndex]);

	const hasPreviousPage = safePage > 0;
	const hasNextPage = totalPages > 0 && safePage < maxPageIndex;
	const offset = safePage * pageSize;

	const setPage = (nextPage: number): void => {
		setPageState(clamp(Math.floor(nextPage), 0, maxPageIndex));
	};

	const setPageSize = (nextSize: number): void => {
		const normalizedSize = Math.max(1, Math.floor(nextSize));
		setPageSizeState(normalizedSize);
		// Keep UX predictable: when page size changes, reset to first page.
		setPageState(0);
	};

	const nextPage = (): void => {
		setPageState((current) => clamp(current + 1, 0, maxPageIndex));
	};

	const previousPage = (): void => {
		setPageState((current) => clamp(current - 1, 0, maxPageIndex));
	};

	const reset = (): void => {
		setPageState(0);
		setPageSizeState(Math.max(1, initialPageSize));
		setTotalItemsState(Math.max(0, options.totalItems ?? 0));
	};

	const setTotalItems = (nextTotal: number): void => {
		const normalizedTotal = Math.max(0, Math.floor(nextTotal));
		setTotalItemsState(normalizedTotal);

		// If current page goes out of range after total update, clamp down.
		const recalculatedTotalPages = normalizedTotal <= 0 ? 0 : Math.ceil(normalizedTotal / pageSize);
		const recalculatedMaxPage = recalculatedTotalPages <= 0 ? 0 : recalculatedTotalPages - 1;
		setPageState((current) => clamp(current, 0, recalculatedMaxPage));
	};

	return {
		page: safePage,
		pageSize,
		totalItems,
		totalPages,
		hasNextPage,
		hasPreviousPage,
		offset,
		setPage,
		setPageSize,
		nextPage,
		previousPage,
		reset,
		setTotalItems,
	};
}

export default usePagination;
