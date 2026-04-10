import { useEffect, useMemo, useState } from 'react';
import { resourceApi } from '../../../core/api/resourceApi';
import type { AvailabilityWindow, BuildingType, ResourceFormValues, ResourceStatus, ResourceType } from '../../../types/resource';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] as const;

function buildDefaultWindows(): Record<string, AvailabilityWindow> {
  return DAYS.reduce<Record<string, AvailabilityWindow>>((acc, day) => {
    acc[day] = { open: '08:00', close: '17:00' };
    return acc;
  }, {});
}

const initialValues: ResourceFormValues = {
  name: '',
  type: '',
  capacity: 1,
  building: '',
  floor: '',
  chairCount: 0,
  tableCount: 0,
  hasAc: false,
  hasFan: false,
  hasProjector: false,
  hasSmartboard: false,
  hasCamera: false,
  hasPodiumWithPc: false,
  hasPodium: false,
  hasWhiteboard: false,
  hasClock: false,
  hasLectureChairs: false,
  hasLectureDesks: false,
  hasSpeakers: false,
  hasPowerOutlets: false,
  hasWifi: false,
  pcCount: 0,
  equipmentCount: 0,
  description: '',
  status: 'ACTIVE',
  allowBookings: false,
  allowRequests: false,
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
          building: data.building ?? 'MAIN',
          floor: data.type === 'EQUIPMENT' ? null : (data.floor ?? 1),
          chairCount: data.chairCount ?? 0,
          tableCount: data.tableCount ?? 0,
          hasAc: data.hasAc ?? false,
          hasFan: data.hasFan ?? false,
          hasProjector: data.hasProjector ?? false,
          hasSmartboard: data.hasSmartboard ?? false,
          hasCamera: data.hasCamera ?? false,
          hasPodiumWithPc: data.hasPodiumWithPc ?? false,
          hasPodium: data.hasPodium ?? false,
          hasWhiteboard: data.hasWhiteboard ?? false,
          hasClock: data.hasClock ?? false,
          hasLectureChairs: data.hasLectureChairs ?? false,
          hasLectureDesks: data.hasLectureDesks ?? false,
          hasSpeakers: data.hasSpeakers ?? false,
          hasPowerOutlets: data.hasPowerOutlets ?? false,
          hasWifi: data.hasWifi ?? false,
          pcCount: data.pcCount ?? 0,
          equipmentCount: data.equipmentCount ?? 0,
          description: data.description ?? '',
          status: data.status,
          allowBookings: data.allowBookings ?? true,
          allowRequests: false,
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
      if (!values.type) {
        setError('Please select a type');
        return false;
      }

      if (!values.building) {
        setError('Please select a building');
        return false;
      }

      if (values.type !== 'EQUIPMENT' && (values.floor === '' || values.floor === null)) {
        setError('Please select a floor');
        return false;
      }

      const payload: ResourceFormValues = {
        name: values.name,
        type: values.type as ResourceType,
        capacity: Number(values.capacity),
        building: values.building as BuildingType,
        floor: values.type === 'EQUIPMENT' ? null : Number(values.floor),
        chairCount: Number(values.chairCount),
        tableCount: Number(values.tableCount),
        hasAc: Boolean(values.hasAc),
        hasFan: Boolean(values.hasFan),
        hasProjector: Boolean(values.hasProjector),
        hasSmartboard: Boolean(values.hasSmartboard),
        hasCamera: Boolean(values.hasCamera),
        hasPodiumWithPc: Boolean(values.hasPodiumWithPc),
        hasPodium: Boolean(values.hasPodium),
        hasWhiteboard: Boolean(values.hasWhiteboard),
        hasClock: Boolean(values.hasClock),
        hasLectureChairs: Boolean(values.hasLectureChairs),
        hasLectureDesks: Boolean(values.hasLectureDesks),
        hasSpeakers: Boolean(values.hasSpeakers),
        hasPowerOutlets: Boolean(values.hasPowerOutlets),
        hasWifi: Boolean(values.hasWifi),
        pcCount: Number(values.pcCount ?? 0),
        equipmentCount: Number(values.equipmentCount ?? 0),
        description: values.description,
        availabilityWindows: values.availabilityWindows,
        allowBookings: Boolean(values.allowBookings),
        allowRequests: false,
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
