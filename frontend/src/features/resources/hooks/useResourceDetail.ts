import { useEffect, useState } from 'react';
import { resourceApi } from '../../../core/api/resourceApi';
import type { ResourceItem } from '../../../types/resource';

export function useResourceDetail(id: string | undefined) {
  const [resource, setResource] = useState<ResourceItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Resource id is missing');
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await resourceApi.getResourceById(id);
        if (active) {
          setResource(data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load resource');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [id]);

  return { resource, loading, error };
}
