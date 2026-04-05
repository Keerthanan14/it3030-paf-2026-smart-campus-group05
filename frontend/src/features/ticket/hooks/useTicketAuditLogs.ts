import { useCallback, useEffect, useState } from "react";
import ticketApi from "../../../core/api/ticketApi";
import type { AuditLogItem } from "../../../types/ticket";

type UseTicketAuditLogsOptions = {
  autoLoad?: boolean;
  defaultEntityType?: string;
};

type AuditFilters = {
  entityType?: string;
  action?: string;
  userId?: string;
};

export function useTicketAuditLogs(options: UseTicketAuditLogsOptions = {}) {
  const autoLoad = options.autoLoad ?? true;

  const [filters, setFilters] = useState<AuditFilters>({
    entityType: options.defaultEntityType,
  });
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [items, setItems] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await ticketApi.listAuditLogs({
        entityType: filters.entityType,
        action: filters.action,
        userId: filters.userId,
        page,
        size,
      });

      setItems(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to fetch audit logs";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters.action, filters.entityType, filters.userId, page, size]);

  useEffect(() => {
    if (!autoLoad) return;
    void fetchLogs();
  }, [autoLoad, fetchLogs]);

  const applyFilters = (next: AuditFilters): void => {
    setFilters(next);
    setPage(0);
  };

  const updateFilters = (partial: Partial<AuditFilters>): void => {
    setFilters((current) => ({ ...current, ...partial }));
    setPage(0);
  };

  const updatePage = (nextPage: number): void => {
    setPage(Math.max(0, nextPage));
  };

  const updateSize = (nextSize: number): void => {
    setSize(Math.max(1, nextSize));
    setPage(0);
  };

  return {
    items,
    loading,
    error,
    filters,
    page,
    size,
    totalPages,
    totalElements,
    setPage: updatePage,
    setSize: updateSize,
    applyFilters,
    updateFilters,
    refresh: fetchLogs,
  };
}

export default useTicketAuditLogs;
