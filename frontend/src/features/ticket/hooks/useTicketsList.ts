import { useCallback, useEffect, useState } from "react";
import ticketApi from "../../../core/api/ticketApi";
import { useTicketStore } from "../../../core/store/ticketStore";
import type { Ticket, TicketFilters } from "../../../types/ticket";

type UseTicketsListOptions = {
  autoLoad?: boolean;
};

export function useTicketsList(options: UseTicketsListOptions = {}) {
  const autoLoad = options.autoLoad ?? true;

  const filters = useTicketStore((state) => state.filters);
  const page = useTicketStore((state) => state.page);
  const size = useTicketStore((state) => state.size);
  const totalPages = useTicketStore((state) => state.totalPages);
  const totalElements = useTicketStore((state) => state.totalElements);
  const setFilters = useTicketStore((state) => state.setFilters);
  const patchFilters = useTicketStore((state) => state.patchFilters);
  const setPage = useTicketStore((state) => state.setPage);
  const setSize = useTicketStore((state) => state.setSize);
  const setPaginationMeta = useTicketStore((state) => state.setPaginationMeta);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await ticketApi.listTickets({ page, size, filters });
      setTickets(data.content);
      setPaginationMeta(data.totalPages, data.totalElements);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch tickets";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters, page, setPaginationMeta, size]);

  useEffect(() => {
    if (!autoLoad) return;
    void fetchTickets();
  }, [autoLoad, fetchTickets]);

  const applyFilters = (nextFilters: TicketFilters): void => {
    setFilters(nextFilters);
  };

  const updateFilters = (partial: Partial<TicketFilters>): void => {
    patchFilters(partial);
  };

  return {
    tickets,
    loading,
    error,
    filters,
    page,
    size,
    totalPages,
    totalElements,
    setPage,
    setSize,
    applyFilters,
    updateFilters,
    refresh: fetchTickets,
  };
}

export default useTicketsList;
