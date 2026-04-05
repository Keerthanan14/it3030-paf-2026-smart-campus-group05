import { useCallback, useEffect, useMemo, useState } from "react";
import ticketApi from "../../../core/api/ticketApi";
import { useTicketStore } from "../../../core/store/ticketStore";
import type { Ticket } from "../../../types/ticket";

type UseTicketDetailOptions = {
  ticketId?: string | null;
  autoLoad?: boolean;
};

export function useTicketDetail(options: UseTicketDetailOptions = {}) {
  const autoLoad = options.autoLoad ?? true;
  const selectedTicketId = useTicketStore((state) => state.selectedTicketId);
  const setSelectedTicketId = useTicketStore((state) => state.setSelectedTicketId);

  const resolvedTicketId = useMemo(() => options.ticketId ?? selectedTicketId, [options.ticketId, selectedTicketId]);

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTicket = useCallback(async () => {
    if (!resolvedTicketId) {
      setTicket(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await ticketApi.getTicketById(resolvedTicketId);
      setTicket(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch ticket detail";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [resolvedTicketId]);

  useEffect(() => {
    if (!autoLoad) return;
    void fetchTicket();
  }, [autoLoad, fetchTicket]);

  return {
    ticket,
    loading,
    error,
    ticketId: resolvedTicketId,
    setSelectedTicketId,
    refresh: fetchTicket,
  };
}

export default useTicketDetail;
