import { useCallback, useEffect, useState } from 'react';
import { resourceApi } from '../../../core/api/resourceApi';
import type { PaginatedResourceResponse, ResourceFilters, ResourceItem, ResourceStatus } from '../../../types/resource';

const defaultFilters: ResourceFilters = {
  keyword: '',
  location: '',
};

export function useAdminResources() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [filters, setFilters] = useState<ResourceFilters>(defaultFilters);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await resourceApi.listResources({ page, size, filters });
      const payload = data as PaginatedResourceResponse;
      setResources(payload.content ?? []);
      setTotalPages(payload.totalPages ?? 0);
      setTotalElements(payload.totalElements ?? 0);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch resources';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [filters, page, size]);

  useEffect(() => {
    void fetchResources();
  }, [fetchResources]);

  const applyFilters = (nextFilters: ResourceFilters) => {
    setPage(0);
    setFilters(nextFilters);
  };

  const setPageSize = (nextSize: number) => {
    setPage(0);
    setSize(nextSize);
  };

  const updateStatus = async (id: string, status: ResourceStatus) => {
    await resourceApi.updateStatus(id, status);
    await fetchResources();
  };

  const removeResource = async (id: string) => {
    await resourceApi.deleteResource(id);
    await fetchResources();
  };

  return {
    resources,
    filters,
    loading,
    error,
    page,
    size,
    totalPages,
    totalElements,
    setPage,
    setPageSize,
    applyFilters,
    updateStatus,
    removeResource,
  };
}