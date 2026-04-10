import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToast } from '../../../shared/components/ui/useToast';
import { useBookingStore } from '../../../core/store/bookingStore';
import bookingApi from '../../../core/api/bookingApi';
import { resourceApi } from '../../../core/api/resourceApi';
import type { BookingApiError, BookingFilters, BookingItem, CreateBookingRequest } from '../../../types/booking';
import type { BookedSlot, ResourceItem, ResourceType } from '../../../types/resource';
import {
  MAX_BOOKING_DURATION_MINUTES,
  buildTimeBoundaryOptions,
  formatResourceLocation,
  formatResourceType,
  isBookableResource,
  maxBookingDateValue,
  minBookingDateValue,
  parseTimeToMinutes,
  resolveWindowForDate,
  toErrorMessage,
  weekdayName,
} from '../utils/bookingHelpers.ts';

interface UseStudentBookingPageResult {
  items: BookingItem[];
  selectedBooking: BookingItem | null;
  filters: BookingFilters;
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  isListLoading: boolean;
  isDetailLoading: boolean;
  isMutating: boolean;
  error: BookingApiError | null;
  resources: ResourceItem[];
  isResourcesLoading: boolean;
  resourceQuery: string;
  setResourceQuery: (value: string) => void;
  onResourceSelect: (resource: ResourceItem) => void;
  selectedResource: ResourceItem | null;
  bookedSeatsForSlot: number;
  availableSpace: number | null;
  bookingDate: string;
  setBookingDate: (value: string) => void;
  onBookingDateChange: (value: string) => void;
  minBookingDate: string;
  maxBookingDate: string;
  selectedWeekday: string;
  selectedDayWindow: { open: string; close: string } | null;
  startTime: string;
  endTime: string;
  startTimeOptions: string[];
  endTimeOptions: string[];
  setStartTime: (value: string) => void;
  setEndTime: (value: string) => void;
  attendeesCount: string;
  setAttendeesCount: (value: string) => void;
  purpose: string;
  setPurpose: (value: string) => void;
  resetCreateForm: () => void;
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (value: boolean) => void;
  closeBookingDetail: () => void;
  selectedResourceLabel: string | null;
  canSubmit: boolean;
  refreshList: () => Promise<void>;
  refreshSelectedBooking: () => Promise<void>;
  onCreateBooking: () => Promise<void>;
  onSelectBooking: (id: string) => Promise<void>;
  onCancelBooking: (id: string) => Promise<void>;
  setPage: (page: number) => void;
  setSize: (size: number) => void;
  patchFilters: (partial: Partial<BookingFilters>) => void;
}

export function useStudentBookingPage(): UseStudentBookingPageResult {
  const toast = useToast();

  const {
    items,
    selectedBooking,
    filters,
    page,
    size,
    totalPages,
    totalElements,
    isListLoading,
    isDetailLoading,
    isMutating,
    error,
    setPage,
    setSize,
    patchFilters,
    fetchBookings,
    fetchBookingById,
    createBooking,
    cancelBooking,
    clearError,
  } = useBookingStore();

  const [resourceId, setResourceId] = useState('');
  const [resourceQuery, setResourceQuery] = useState('');
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isResourcesLoading, setIsResourcesLoading] = useState(false);
  const [bookingDate, setBookingDate] = useState(() => minBookingDateValue());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [purpose, setPurpose] = useState('');
  const [attendeesCount, setAttendeesCount] = useState('1');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [bookedSeatsForSlot, setBookedSeatsForSlot] = useState(0);
  const [dayBookings, setDayBookings] = useState<BookedSlot[]>([]);
  const [blockedStudyAreaDates, setBlockedStudyAreaDates] = useState<string[]>([]);

  const resetCreateForm = (): void => {
    setResourceId('');
    setResourceQuery('');
    setBookingDate(minBookingDateValue());
    setStartTime('');
    setEndTime('');
    setPurpose('');
    setAttendeesCount('1');
    setBookedSeatsForSlot(0);
  };

  const minBookingDate = useMemo(() => minBookingDateValue(), []);
  const maxBookingDate = useMemo(() => maxBookingDateValue(), []);

  const parseDateValue = (value: string): Date => new Date(`${value}T00:00:00`);
  const toDateValue = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings, page, size, filters]);

  useEffect(() => {
    const loadResources = async () => {
      setIsResourcesLoading(true);
      try {
        const response = await resourceApi.listResources({
          page: 0,
          size: 200,
          filters: { status: 'ACTIVE', allowBookings: true },
        });
        const loadedResources = (response.data.content ?? []).filter(isBookableResource);
        setResources(loadedResources);
      } finally {
        setIsResourcesLoading(false);
      }
    };

    void loadResources();
  }, []);

  const selectedResource = useMemo(() => {
    return resources.find((item) => item.id === resourceId) ?? null;
  }, [resources, resourceId]);

  const selectedResourceLabel = useMemo(() => {
    if (!selectedResource) {
      return null;
    }

    return `location: ${formatResourceLocation(selectedResource)}`;
  }, [selectedResource]);

  const resourceLimit = useMemo(() => {
    if (!selectedResource) {
      return null;
    }

    if (selectedResource.type === 'EQUIPMENT') {
      return Math.max(1, selectedResource.equipmentCount ?? selectedResource.capacity);
    }

    return selectedResource.capacity;
  }, [selectedResource]);

  const isSingleBookingPerDayType = (type?: ResourceType | null): boolean => {
    return type === 'STUDY_AREA' || type === 'EQUIPMENT';
  };

  useEffect(() => {
    const loadBlockedStudyAreaDates = async () => {
      if (!isSingleBookingPerDayType(selectedResource?.type)) {
        setBlockedStudyAreaDates([]);
        return;
      }

      try {
        const response = await bookingApi.getBookings({
          page: 0,
          size: 500,
          filters: {
            from: minBookingDate,
            to: maxBookingDate,
          },
        });

        const activeBookings = response.content.filter(
          (booking) => booking.status === 'PENDING' || booking.status === 'APPROVED'
        );

        const distinctResourceIds = [...new Set(activeBookings.map((booking) => booking.resourceId))];
        const typeByResourceId = new Map<string, ResourceType>();

        await Promise.all(
          distinctResourceIds.map(async (id) => {
            const fromLoaded = resources.find((resource) => resource.id === id);
            if (fromLoaded) {
              typeByResourceId.set(id, fromLoaded.type);
              return;
            }

            try {
              const fetched = await resourceApi.getResourceById(id);
              typeByResourceId.set(id, fetched.data.type);
            } catch {
              typeByResourceId.set(id, 'OTHER');
            }
          })
        );

        const blockedDates = [...new Set(
          activeBookings
            .filter((booking) => isSingleBookingPerDayType(typeByResourceId.get(booking.resourceId) ?? null))
            .map((booking) => booking.bookingDate)
        )];

        setBlockedStudyAreaDates(blockedDates);
      } catch {
        setBlockedStudyAreaDates([]);
      }
    };

    void loadBlockedStudyAreaDates();
  }, [selectedResource, resources, minBookingDate, maxBookingDate]);

  useEffect(() => {
    if (!isSingleBookingPerDayType(selectedResource?.type) || !blockedStudyAreaDates.includes(bookingDate)) {
      return;
    }

    const from = parseDateValue(minBookingDate);
    const to = parseDateValue(maxBookingDate);

    for (let cursor = new Date(from); cursor <= to; cursor.setDate(cursor.getDate() + 1)) {
      const candidate = toDateValue(cursor);
      if (!blockedStudyAreaDates.includes(candidate)) {
        setBookingDate(candidate);
        return;
      }
    }

    setStartTime('');
    setEndTime('');
  }, [selectedResource, blockedStudyAreaDates, bookingDate, minBookingDate, maxBookingDate]);

  useEffect(() => {
    const loadDayBookings = async () => {
      if (!selectedResource || !bookingDate) {
        setDayBookings([]);
        return;
      }

      try {
        const response = await resourceApi.getAvailability(selectedResource.id, bookingDate, bookingDate);
        const slots = (response.data.bookedSlots ?? []).filter((slot) => slot.date === bookingDate);
        setDayBookings(slots);
      } catch {
        setDayBookings([]);
      }
    };

    void loadDayBookings();
  }, [selectedResource, bookingDate]);

  useEffect(() => {
    if (!selectedResource || !startTime || !endTime) {
      setBookedSeatsForSlot(0);
      return;
    }

    const selectedStart = parseTimeToMinutes(startTime);
    const selectedEnd = parseTimeToMinutes(endTime);
    if (!Number.isFinite(selectedStart) || !Number.isFinite(selectedEnd) || selectedEnd <= selectedStart) {
      setBookedSeatsForSlot(0);
      return;
    }

    const reservedSeats = dayBookings
      .filter((slot) => {
        const bookingStart = parseTimeToMinutes(slot.startTime);
        const bookingEnd = parseTimeToMinutes(slot.endTime);
        return selectedStart < bookingEnd && selectedEnd > bookingStart;
      })
      .reduce((total, slot) => total + Math.max(0, Number(slot.attendeesCount) || 0), 0);

    setBookedSeatsForSlot(reservedSeats);
  }, [selectedResource, startTime, endTime, dayBookings]);

  const availableSpace = useMemo(() => {
    if (!selectedResource || resourceLimit === null) {
      return null;
    }

    return Math.max(resourceLimit - bookedSeatsForSlot, 0);
  }, [selectedResource, resourceLimit, bookedSeatsForSlot]);

  const selectedDayWindow = useMemo(() => {
    return resolveWindowForDate(selectedResource?.availabilityWindows ?? null, bookingDate);
  }, [selectedResource, bookingDate]);

  const selectedWeekday = useMemo(() => weekdayName(bookingDate), [bookingDate]);

  const overlappingBookedSeats = useCallback((candidateStart: string, candidateEnd: string): number => {
    const startMinutes = parseTimeToMinutes(candidateStart);
    const endMinutes = parseTimeToMinutes(candidateEnd);

    return dayBookings.reduce((total, booking) => {
      const bookingStart = parseTimeToMinutes(booking.startTime);
      const bookingEnd = parseTimeToMinutes(booking.endTime);
      if (startMinutes < bookingEnd && endMinutes > bookingStart) {
        return total + Math.max(0, Number(booking.attendeesCount) || 0);
      }
      return total;
    }, 0);
  }, [dayBookings]);

  const hasNoSeatsLeftForRange = useCallback((candidateStart: string, candidateEnd: string): boolean => {
    if (!selectedResource || resourceLimit === null) {
      return false;
    }

    const booked = overlappingBookedSeats(candidateStart, candidateEnd);
    return booked >= resourceLimit;
  }, [selectedResource, resourceLimit, overlappingBookedSeats]);

  const timeBoundaries = useMemo(() => {
    if (!selectedDayWindow) {
      return [];
    }
    return buildTimeBoundaryOptions(selectedDayWindow.open, selectedDayWindow.close);
  }, [selectedDayWindow]);

  const startTimeOptions = useMemo(() => {
    if (timeBoundaries.length < 2) {
      return [];
    }

    return timeBoundaries.slice(0, -1).filter((candidateStart) => {
      const startMinutes = parseTimeToMinutes(candidateStart);
      return timeBoundaries.some((candidateEnd) => {
        const endMinutes = parseTimeToMinutes(candidateEnd);
        if (endMinutes <= startMinutes) {
          return false;
        }
        if (endMinutes > startMinutes + MAX_BOOKING_DURATION_MINUTES) {
          return false;
        }
        return !hasNoSeatsLeftForRange(candidateStart, candidateEnd);
      });
    });
  }, [timeBoundaries, hasNoSeatsLeftForRange]);

  const endTimeOptions = useMemo(() => {
    if (timeBoundaries.length < 2) {
      return [];
    }

    const selectedStart = parseTimeToMinutes(startTime);
    const maxAllowedEnd = selectedStart + MAX_BOOKING_DURATION_MINUTES;

    return timeBoundaries.filter((time: string) => {
      const minutes = parseTimeToMinutes(time);
      return minutes > selectedStart && minutes <= maxAllowedEnd && !hasNoSeatsLeftForRange(startTime, time);
    });
  }, [timeBoundaries, startTime, hasNoSeatsLeftForRange]);

  useEffect(() => {
    if (!selectedDayWindow || startTimeOptions.length === 0) {
      setStartTime('');
      setEndTime('');
      return;
    }

    const nextStart = startTimeOptions[0];
    const nextEnd = timeBoundaries.find((time: string) => parseTimeToMinutes(time) > parseTimeToMinutes(nextStart)) ?? '';
    setStartTime(nextStart);
    setEndTime(nextEnd);
  }, [bookingDate, selectedDayWindow, startTimeOptions, timeBoundaries]);

  useEffect(() => {
    if (!selectedResource) {
      return;
    }

    const current = Number(attendeesCount);
    const maxAllowed = availableSpace ?? resourceLimit ?? selectedResource.capacity;
    if (Number.isFinite(current) && current > maxAllowed) {
      setAttendeesCount(String(maxAllowed));
    }
  }, [selectedResource, attendeesCount, availableSpace, resourceLimit]);

  const canSubmit = useMemo(() => {
    const attendees = Number(attendeesCount);
    const isBlockedStudyAreaDate = isSingleBookingPerDayType(selectedResource?.type) && blockedStudyAreaDates.includes(bookingDate);
    const isWithinCapacity = selectedResource ? attendees <= (availableSpace ?? resourceLimit ?? selectedResource.capacity) : true;
    const isDateValid = bookingDate >= minBookingDate && bookingDate <= maxBookingDate;
    const isTimeValid = startTime.length > 0 && endTime.length > 0 && endTimeOptions.includes(endTime);

    return (
      resourceId.trim().length > 10 &&
      bookingDate.length > 0 &&
      isDateValid &&
      !isBlockedStudyAreaDate &&
      isTimeValid &&
      purpose.trim().length >= 5 &&
      attendees >= 1 &&
      isWithinCapacity
    );
  }, [resourceId, bookingDate, minBookingDate, maxBookingDate, startTime, endTime, endTimeOptions, purpose, attendeesCount, selectedResource, availableSpace, blockedStudyAreaDates, resourceLimit]);

  const refreshList = async (): Promise<void> => {
    await fetchBookings();
  };

  const refreshSelectedBooking = async (): Promise<void> => {
    const bookingId = useBookingStore.getState().selectedBooking?.id;
    if (!bookingId) {
      return;
    }

    await fetchBookingById(bookingId);
  };

  const formatResourceQueryLabel = (resource: ResourceItem): string =>
    resource.type === 'EQUIPMENT' ? resource.name : `${resource.name} ${formatResourceType(resource.type)}`;

  const onResourceSelect = (resource: ResourceItem): void => {
    setResourceId(resource.id);
    setResourceQuery(formatResourceQueryLabel(resource));
  };

  const onBookingDateChange = (value: string): void => {
    if (!value) {
      setBookingDate(value);
      return;
    }

    if (isSingleBookingPerDayType(selectedResource?.type) && blockedStudyAreaDates.includes(value)) {
      toast.warning('Date unavailable', 'You already have a booking on this date.');
      return;
    }

    setBookingDate(value);
  };

  const getResourceTypeForBooking = async (bookingResourceId: string): Promise<ResourceType | null> => {
    if (selectedResource && bookingResourceId === selectedResource.id) {
      return selectedResource.type;
    }

    const fromLoaded = resources.find((resource) => resource.id === bookingResourceId);
    if (fromLoaded) {
      return fromLoaded.type;
    }

    try {
      const fetched = await resourceApi.getResourceById(bookingResourceId);
      return fetched.data.type;
    } catch {
      return null;
    }
  };

  const onCreateBooking = async (): Promise<void> => {
    if (isSingleBookingPerDayType(selectedResource?.type) && blockedStudyAreaDates.includes(bookingDate)) {
      toast.warning('Daily booking limit', 'Only one study area or equipment booking per day is allowed.');
      return;
    }

    if (bookingDate < minBookingDate || bookingDate > maxBookingDate) {
      toast.warning('Invalid booking date', `Use ${minBookingDate} - ${maxBookingDate}.`);
      return;
    }

    if (!selectedDayWindow || startTimeOptions.length === 0 || endTimeOptions.length === 0) {
      toast.warning('Time unavailable', 'No available time slots for selected day.');
      return;
    }

    const durationMinutes = parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0 || durationMinutes > MAX_BOOKING_DURATION_MINUTES) {
      toast.warning('Invalid duration', 'Max booking duration is 3 hours.');
      return;
    }

    if (isSingleBookingPerDayType(selectedResource?.type)) {
      const sameDay = await bookingApi.getBookings({
        page: 0,
        size: 200,
        filters: { from: bookingDate, to: bookingDate },
      });

      const activeSameDay = sameDay.content.filter(
        (booking) =>
          booking.bookingDate === bookingDate &&
          booking.status !== 'CANCELLED' &&
          booking.status !== 'REJECTED'
      );

      for (const booking of activeSameDay) {
        const resourceType = await getResourceTypeForBooking(booking.resourceId);
        if (isSingleBookingPerDayType(resourceType)) {
          toast.warning('Daily booking limit', 'Only one study area or equipment booking per day is allowed.');
          return;
        }
      }
    }

    if (selectedResource && Number(attendeesCount) > (availableSpace ?? resourceLimit ?? selectedResource.capacity)) {
      const available = availableSpace ?? resourceLimit ?? selectedResource.capacity;
      const unitLabel = selectedResource.type === 'EQUIPMENT' ? 'items' : 'seats';
      toast.warning('Capacity exceeded', `Only ${available} ${unitLabel} are available for this time slot.`);
      return;
    }

    if (!canSubmit) {
      toast.warning('Missing details', 'Please complete all required booking fields.');
      return;
    }

    const payload: CreateBookingRequest = {
      resourceId: resourceId.trim(),
      bookingDate,
      startTime,
      endTime,
      purpose: purpose.trim(),
      attendeesCount: Number(attendeesCount),
    };

    try {
      const created = await createBooking(payload);
      toast.success('Booking created', `Request for ${created.resourceName} has been submitted.`);
      resetCreateForm();
      setIsCreateModalOpen(false);
      await refreshList();
    } catch (caught: unknown) {
      const apiError = (caught as BookingApiError) || error;
      toast.error('Booking failed', toErrorMessage(apiError, 'Could not create booking.'));
    }
  };

  const onSelectBooking = async (id: string): Promise<void> => {
    clearError();
    await fetchBookingById(id);
  };

  const closeBookingDetail = (): void => {
    useBookingStore.getState().setSelectedBooking(null);
  };

  const onCancelBooking = async (id: string): Promise<void> => {
    const confirmed = window.confirm('Cancel this approved booking?');
    if (!confirmed) {
      return;
    }

    try {
      const updated = await cancelBooking(id);
      toast.success('Booking cancelled', `Booking ${updated.id.slice(0, 8)} was cancelled.`);
      await refreshList();
      if (selectedBooking?.id === id) {
        await fetchBookingById(id);
      }
    } catch (caught: unknown) {
      const apiError = (caught as BookingApiError) || error;
      toast.error('Cancel failed', toErrorMessage(apiError, 'Could not cancel booking.'));
    }
  };

  return {
    items,
    selectedBooking,
    filters,
    page,
    size,
    totalPages,
    totalElements,
    isListLoading,
    isDetailLoading,
    isMutating,
    error,
    resources,
    isResourcesLoading,
    resourceQuery,
    setResourceQuery,
    onResourceSelect,
    selectedResource,
    bookedSeatsForSlot,
    availableSpace,
    bookingDate,
    setBookingDate,
    onBookingDateChange,
    minBookingDate,
    maxBookingDate,
    selectedWeekday,
    selectedDayWindow,
    startTime,
    endTime,
    startTimeOptions,
    endTimeOptions,
    setStartTime,
    setEndTime,
    attendeesCount,
    setAttendeesCount,
    purpose,
    setPurpose,
    resetCreateForm,
    isCreateModalOpen,
    setIsCreateModalOpen,
    closeBookingDetail,
    selectedResourceLabel,
    canSubmit,
    refreshList,
    refreshSelectedBooking,
    onCreateBooking,
    onSelectBooking,
    onCancelBooking,
    setPage,
    setSize,
    patchFilters,
  };
}
