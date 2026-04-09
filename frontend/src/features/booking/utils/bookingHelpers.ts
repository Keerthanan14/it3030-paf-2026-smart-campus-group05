import type { BookingApiError } from '../../../types/booking';
import type { ResourceItem } from '../../../types/resource';

export const MAX_BOOKING_DURATION_MINUTES = 180;

export const toErrorMessage = (error: BookingApiError | null, fallback: string): string => {
  if (!error) {
    return fallback;
  }

  if (error.code === 'CONFLICT') {
    return 'This slot is already booked. Please pick another time.';
  }

  return error.message || fallback;
};

export const minBookingDateValue = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

export const maxBookingDateValue = (): string => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().slice(0, 10);
};

export const formatResourceType = (type: string): string => type.replace(/_/g, ' ');

export const formatResourceLocation = (resource: ResourceItem): string => {
  const building = resource.building === 'MAIN' ? 'Main Building' : resource.building === 'SUB' ? 'Sub Building' : '';

  if (!building) {
    return resource.location;
  }

  if (typeof resource.floor !== 'number') {
    return building;
  }

  if (resource.floor === 0) {
    return `${building} Ground Floor`;
  }

  return `${building} ${resource.floor} th Floor`;
};

export const isBookableResource = (resource: ResourceItem): boolean => {
  const raw = resource.allowBookings as unknown;

  if (typeof raw === 'boolean') {
    return raw;
  }
  if (typeof raw === 'string') {
    return raw.toLowerCase() === 'true';
  }
  if (typeof raw === 'number') {
    return raw === 1;
  }

  return false;
};

export const clampAttendees = (rawValue: string, maxCapacity?: number): string => {
  if (rawValue === '') {
    return '';
  }

  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return '1';
  }

  const minBound = Math.max(1, Math.floor(parsed));
  if (typeof maxCapacity === 'number') {
    return String(Math.min(minBound, maxCapacity));
  }

  return String(minBound);
};

const toLocalDate = (dateValue: string): Date => {
  const [year, month, day] = dateValue.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
};

export const weekdayName = (dateValue: string): string => {
  if (!dateValue) {
    return '';
  }

  const dayNames = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return dayNames[toLocalDate(dateValue).getDay()] ?? '';
};

export const normalizeDayKey = (value: string): string => value.trim().toLowerCase().replace(/[^a-z]/g, '');

export const resolveWindowForDate = (
  windows: Record<string, { open: string; close: string }> | null | undefined,
  dateValue: string
): { open: string; close: string } | null => {
  if (!windows || !dateValue) {
    return null;
  }

  const fullDay = weekdayName(dateValue);
  if (!fullDay) {
    return null;
  }

  const fullKey = normalizeDayKey(fullDay);
  const shortKey = fullKey.slice(0, 3);

  for (const [key, value] of Object.entries(windows)) {
    const normalized = normalizeDayKey(key);
    if (normalized === fullKey || normalized === shortKey) {
      return value;
    }
  }

  return null;
};

export const parseTimeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return NaN;
  }
  return hours * 60 + minutes;
};

export const formatMinutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

export const buildTimeBoundaryOptions = (open: string, close: string, stepMinutes = 30): string[] => {
  const openMinutes = parseTimeToMinutes(open);
  const closeMinutes = parseTimeToMinutes(close);

  if (!Number.isFinite(openMinutes) || !Number.isFinite(closeMinutes) || openMinutes >= closeMinutes) {
    return [];
  }

  const options: string[] = [];
  for (let current = openMinutes; current <= closeMinutes; current += stepMinutes) {
    options.push(formatMinutesToTime(current));
  }

  if (options[options.length - 1] !== close) {
    options.push(close);
  }

  return options;
};
