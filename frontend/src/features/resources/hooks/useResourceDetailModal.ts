import { useState } from 'react';
import { resourceApi } from '../../../core/api/resourceApi';
import type { ResourceItem } from '../../../types/resource';

export function useResourceDetailModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resource, setResource] = useState<ResourceItem | null>(null);

  const open = async (id: string) => {
    setIsOpen(true);
    setLoading(true);
    setError(null);
    setResource(null);
    try {
      const { data } = await resourceApi.getResourceById(id);
      setResource(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load resource details');
    } finally {
      setLoading(false);
    }
  };

  const close = () => {
    setIsOpen(false);
    setLoading(false);
    setError(null);
    setResource(null);
  };

  return {
    isOpen,
    loading,
    error,
    resource,
    open,
    close,
  };
}
