import { useEffect, useMemo, useState } from 'react';
import { resourceApi } from '../../../core/api/resourceApi';
import type { AvailabilityWindow, ResourceFormValues, ResourceStatus, ResourceType } from '../../../types/resource';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

function buildDefaultWindows(): Record<string, AvailabilityWindow> {
  return DAYS.reduce<Record<string, AvailabilityWindow>>((acc, day) => {
    acc[day] = { open: '08:00', close: '17:00' };
    return acc;
  }, {});
}

const initialValues: ResourceFormValues = {
  name: '',
  type: 'ROOM',
  capacity: 1,
  location: '',
  description: '',
  status: 'ACTIVE',
  availabilityWindows: buildDefaultWindows(),
};

export function useResourceForm(id?: string) {
  const [values, setValues] = useState<ResourceFormValues>(initialValues);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = useMemo(() => Boolean(id), [id]);

  useEffect(() => {
    if (!id) {
      setValues(initialValues);
      return;
    }

    let active = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await resourceApi.getResourceById(id);
        if (!active) {
          return;
        }
        setValues({
          name: data.name,
          type: data.type,
          capacity: data.capacity,
          location: data.location,
          description: data.description ?? '',
          status: data.status,
          availabilityWindows: data.availabilityWindows ?? buildDefaultWindows(),
        });
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

  const setField = <K extends keyof ResourceFormValues>(field: K, value: ResourceFormValues[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  };

  const setWindowField = (day: string, field: keyof AvailabilityWindow, value: string) => {
    setValues((prev) => ({
      ...prev,
      availabilityWindows: {
        ...(prev.availabilityWindows ?? {}),
        [day]: {
          ...(prev.availabilityWindows?.[day] ?? { open: '08:00', close: '17:00' }),
          [field]: value,
        },
      },
    }));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload: ResourceFormValues = {
        name: values.name,
        type: values.type as ResourceType,
        capacity: Number(values.capacity),
        location: values.location,
        description: values.description,
        availabilityWindows: values.availabilityWindows,
        ...(isEdit ? { status: values.status as ResourceStatus } : {}),
      };

      if (id) {
        await resourceApi.updateResource(id, payload);
      } else {
        await resourceApi.createResource(payload);
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save resource');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    values,
    loading,
    saving,
    error,
    isEdit,
    days: DAYS,
    setField,
    setWindowField,
    save,
  };
}
