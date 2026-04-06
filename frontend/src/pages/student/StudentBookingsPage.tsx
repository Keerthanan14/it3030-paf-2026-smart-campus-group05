import { useEffect, useMemo, useState } from 'react';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { Input } from '../../shared/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../shared/components/ui/Table';
import { useToast } from '../../shared/components/ui/ToastProvider';
import { useBookingStore } from '../../core/store/bookingStore';
import type { BookingApiError, BookingItem, BookingStatus, CreateBookingRequest } from '../../types/booking';
import { useSearchParams } from 'react-router-dom';

const badgeTone: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-slate-200 text-slate-800',
};

const toErrorMessage = (error: BookingApiError | null, fallback: string): string => {
  if (!error) {
    return fallback;
  }

  if (error.code === 'CONFLICT') {
    return 'This slot is already booked. Please pick another time.';
  }

  return error.message || fallback;
};

const nowDate = (): string => new Date().toISOString().slice(0, 10);

const canCancelBooking = (booking: BookingItem): boolean => {
  if (booking._links) {
    return Boolean(booking._links.cancel);
  }

  return booking.status === 'APPROVED';
};

export default function StudentBookingsPage() {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const prefilledResourceId = searchParams.get('resourceId');
  const prefilledDate = searchParams.get('date');
  const prefilledStartTime = searchParams.get('startTime');
  const prefilledEndTime = searchParams.get('endTime');

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

  const [resourceId, setResourceId] = useState(() => prefilledResourceId ?? '');
  const [bookingDate, setBookingDate] = useState(() => prefilledDate ?? nowDate());
  const [startTime, setStartTime] = useState(() => prefilledStartTime ?? '09:00');
  const [endTime, setEndTime] = useState(() => prefilledEndTime ?? '10:00');
  const [purpose, setPurpose] = useState('');
  const [attendeesCount, setAttendeesCount] = useState('1');

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings, page, size, filters]);

  const canSubmit = useMemo(() => {
    return (
      resourceId.trim().length > 10 &&
      bookingDate.length > 0 &&
      startTime.length > 0 &&
      endTime.length > 0 &&
      purpose.trim().length >= 5 &&
      Number(attendeesCount) >= 1
    );
  }, [resourceId, bookingDate, startTime, endTime, purpose, attendeesCount]);

  const refreshList = async (): Promise<void> => {
    await fetchBookings();
  };

  const onCreateBooking = async (): Promise<void> => {
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
      setPurpose('');
      setAttendeesCount('1');
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Bookings</h1>
        <p className="mt-1 text-sm text-foreground/70">Create and manage your booking requests with live status updates.</p>
        <hr className="mt-4 -mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />
      </div>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">Create Booking Request</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <Input label="Resource ID" value={resourceId} onChange={(e) => setResourceId(e.target.value)} placeholder="Paste resource UUID" />
          <Input
            type="number"
            min={1}
            label="Attendees"
            value={attendeesCount}
            onChange={(e) => setAttendeesCount(e.target.value)}
            placeholder="1"
          />
        </div>
        {prefilledResourceId ? (
          <p className="text-xs text-foreground/70">Resource and slot details were prefilled from the selected resource calendar.</p>
        ) : null}

        <div className="grid gap-3 md:grid-cols-3">
          <Input type="date" label="Booking Date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
          <Input type="time" label="Start Time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
          <Input type="time" label="End Time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Purpose</label>
          <textarea
            className="min-h-24 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="Describe why this resource is needed"
          />
        </div>

        {error ? <p className="text-sm text-rose-600">{toErrorMessage(error, 'Please check your request and try again.')}</p> : null}

        <div className="flex justify-end">
          <Button type="button" onClick={() => void onCreateBooking()} isLoading={isMutating} disabled={!canSubmit}>
            Submit Booking
          </Button>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            <label className="mb-1 block text-sm font-medium">Status</label>
            <select
              className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
              value={filters.status ?? ''}
              onChange={(e) => patchFilters({ status: (e.target.value || undefined) as BookingStatus | undefined })}
            >
              <option value="">All</option>
              <option value="PENDING">PENDING</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </div>

          <div className="min-w-40 flex-1">
            <Input
              label="From"
              type="date"
              value={filters.from ?? ''}
              onChange={(e) => patchFilters({ from: e.target.value || undefined })}
            />
          </div>

          <div className="min-w-40 flex-1">
            <Input
              label="To"
              type="date"
              value={filters.to ?? ''}
              onChange={(e) => patchFilters({ to: e.target.value || undefined })}
            />
          </div>

          <Button type="button" variant="outline" onClick={() => void refreshList()} isLoading={isListLoading}>
            Refresh
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Resource</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => void onSelectBooking(item.id)}>
                <TableCell>{item.resourceName}</TableCell>
                <TableCell>{item.bookingDate}</TableCell>
                <TableCell>
                  {item.startTime} - {item.endTime}
                </TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeTone[item.status]}`}>
                    {item.status}
                  </span>
                </TableCell>
                <TableCell>
                  {canCancelBooking(item) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        void onCancelBooking(item.id);
                      }}
                      isLoading={isMutating}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <span className="text-xs text-foreground/60">No action</span>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {items.length === 0 && !isListLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-foreground/60">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/70">
            Showing page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} total)
          </p>
          <div className="flex items-center gap-2">
            <select className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm" value={size} onChange={(e) => setSize(Number(e.target.value))}>
              <option value={5}>5 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
            <Button type="button" variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 0 || isListLoading}>
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={isListLoading || totalPages === 0 || page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-lg font-semibold">Booking Detail</h2>
        {!selectedBooking && !isDetailLoading ? <p className="text-sm text-foreground/70">Select a booking to view details.</p> : null}

        {selectedBooking ? (
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p>
              <span className="font-medium">Booking ID:</span> {selectedBooking.id}
            </p>
            <p>
              <span className="font-medium">Resource:</span> {selectedBooking.resourceName}
            </p>
            <p>
              <span className="font-medium">Date:</span> {selectedBooking.bookingDate}
            </p>
            <p>
              <span className="font-medium">Time:</span> {selectedBooking.startTime} - {selectedBooking.endTime}
            </p>
            <p>
              <span className="font-medium">Status:</span> {selectedBooking.status}
            </p>
            <p>
              <span className="font-medium">Attendees:</span> {selectedBooking.attendeesCount}
            </p>
            <p className="md:col-span-2">
              <span className="font-medium">Purpose:</span> {selectedBooking.purpose}
            </p>
            {selectedBooking.status === 'REJECTED' ? (
              <p className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-700">
                <span className="font-medium">Rejection Reason:</span> {selectedBooking.rejectionReason || 'No reason provided'}
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>
    </div>
  );
}
