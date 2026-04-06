import { useEffect, useMemo, useState } from 'react';
import { resourceApi } from '../../../core/api/resourceApi';
import type { ResourceAvailabilityResponse } from '../../../types/resource';

function toDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function useResourceAvailability(resourceId: string | undefined) {
  const [from, setFrom] = useState(() => {
    const now = new Date();
    return toDateInput(now);
  });
  const [to, setTo] = useState(() => {
    const now = new Date();
    const next = new Date(now);
    next.setDate(now.getDate() + 30);
    return toDateInput(next);
  });

  const [data, setData] = useState<ResourceAvailabilityResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shiftRange = (days: number) => {
    const fromDate = parseDate(from);
    const toDate = parseDate(to);
    fromDate.setDate(fromDate.getDate() + days);
    toDate.setDate(toDate.getDate() + days);
    setFrom(toDateInput(fromDate));
    setTo(toDateInput(toDate));
  };

  const setPresetRange = (lengthInDays: number) => {
    const start = parseDate(from);
    const end = new Date(start);
    end.setDate(start.getDate() + lengthInDays);
    setTo(toDateInput(end));
  };

  const canLoad = useMemo(() => Boolean(resourceId && from && to), [resourceId, from, to]);

  useEffect(() => {
    if (!canLoad || !resourceId) {
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await resourceApi.getAvailability(resourceId, from, to);
        if (active) {
          setData(response.data);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load availability');
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
  }, [canLoad, from, resourceId, to]);

  return {
    from,
    to,
    setFrom,
    setTo,
    shiftRange,
    setPresetRange,
    data,
    loading,
    error,
  };
}
