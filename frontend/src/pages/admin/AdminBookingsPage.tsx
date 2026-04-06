import { useEffect, useState } from 'react';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { Input } from '../../shared/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../shared/components/ui/Table';
import { useToast } from '../../shared/components/ui/useToast';
import { useBookingStore } from '../../core/store/bookingStore';
import type { BookingApiError, BookingItem, BookingStatus } from '../../types/booking';

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
    return 'This booking conflicts with an existing approval. Review time and resource filters.';
  }

  return error.message || fallback;
};

const canApproveBooking = (booking: BookingItem): boolean => {
  if (booking._links) {
    return Boolean(booking._links.approve);
  }

  return booking.status === 'PENDING';
};

const canRejectBooking = (booking: BookingItem): boolean => {
  if (booking._links) {
    return Boolean(booking._links.reject);
  }

  return booking.status === 'PENDING';
};

export default function AdminBookingsPage() {
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
    isExportingPdf,
    isExportingExcel,
    error,
    setPage,
    setSize,
    patchFilters,
    fetchBookings,
    fetchBookingById,
    approveBooking,
    rejectBooking,
    exportBookingsPdf,
    exportBookingsExcel,
    clearError,
  } = useBookingStore();

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectBookingId, setRejectBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings, page, size, filters]);

  const onSelectBooking = async (id: string): Promise<void> => {
    clearError();
    await fetchBookingById(id);
  };

  const onApprove = async (id: string): Promise<void> => {
    try {
      const updated = await approveBooking(id);
      toast.success('Booking approved', `Booking ${updated.id.slice(0, 8)} has been approved.`);
      await fetchBookings();
      if (selectedBooking?.id === id) {
        await fetchBookingById(id);
      }
    } catch (caught: unknown) {
      const apiError = (caught as BookingApiError) || error;
      toast.error('Approve failed', toErrorMessage(apiError, 'Could not approve booking.'));
    }
  };

  const openRejectModal = (id: string): void => {
    setRejectBookingId(id);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const closeRejectModal = (): void => {
    setIsRejectModalOpen(false);
    setRejectBookingId(null);
    setRejectReason('');
  };

  const onRejectConfirm = async (): Promise<void> => {
    if (!rejectBookingId) {
      return;
    }

    if (rejectReason.trim().length < 10) {
      toast.warning('Reason required', 'Rejection reason must be at least 10 characters.');
      return;
    }

    try {
      const updated = await rejectBooking(rejectBookingId, {
        rejectionReason: rejectReason.trim(),
      });
      toast.success('Booking rejected', `Booking ${updated.id.slice(0, 8)} has been rejected.`);
      closeRejectModal();
      await fetchBookings();
      if (selectedBooking?.id === rejectBookingId) {
        await fetchBookingById(rejectBookingId);
      }
    } catch (caught: unknown) {
      const apiError = (caught as BookingApiError) || error;
      toast.error('Reject failed', toErrorMessage(apiError, 'Could not reject booking.'));
    }
  };

  const onExportPdf = async (): Promise<void> => {
    await exportBookingsPdf();
    if (!useBookingStore.getState().error) {
      toast.success('PDF exported', 'Booking report download has started.');
      return;
    }
    toast.error('PDF export failed', toErrorMessage(useBookingStore.getState().error, 'Could not export PDF report.'));
  };

  const onExportExcel = async (): Promise<void> => {
    await exportBookingsExcel();
    if (!useBookingStore.getState().error) {
      toast.success('Excel exported', 'Booking report download has started.');
      return;
    }
    toast.error('Excel export failed', toErrorMessage(useBookingStore.getState().error, 'Could not export Excel report.'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Booking Management</h1>
        <p className="mt-1 text-sm text-foreground/70">Review pending bookings, then approve or reject with a clear reason.</p>
        <hr className="mt-4 -mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />
      </div>

      <Card className="space-y-4 p-5">
        <div className="grid gap-3 md:grid-cols-4">
          <div>
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

          <Input
            label="Resource ID"
            value={filters.resourceId ?? ''}
            onChange={(e) => patchFilters({ resourceId: e.target.value || undefined })}
            placeholder="Filter by resource UUID"
          />

          <Input
            label="From"
            type="date"
            value={filters.from ?? ''}
            onChange={(e) => patchFilters({ from: e.target.value || undefined })}
          />

          <Input
            label="To"
            type="date"
            value={filters.to ?? ''}
            onChange={(e) => patchFilters({ to: e.target.value || undefined })}
          />
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => void onExportPdf()} isLoading={isExportingPdf}>
            Export PDF
          </Button>
          <Button type="button" variant="outline" onClick={() => void onExportExcel()} isLoading={isExportingExcel}>
            Export Excel
          </Button>
          <Button type="button" variant="outline" onClick={() => void fetchBookings()} isLoading={isListLoading}>
            Refresh
          </Button>
        </div>

        {error ? <p className="text-sm text-rose-600">{toErrorMessage(error, 'Could not load bookings.')}</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Resource</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => void onSelectBooking(item.id)}>
                <TableCell>{item.userName}</TableCell>
                <TableCell>{item.resourceName}</TableCell>
                <TableCell>{item.bookingDate}</TableCell>
                <TableCell>
                  {item.startTime} - {item.endTime}
                </TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeTone[item.status]}`}>{item.status}</span>
                </TableCell>
                <TableCell>
                  {canApproveBooking(item) || canRejectBooking(item) ? (
                    <div className="flex gap-2">
                      {canApproveBooking(item) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          isLoading={isMutating}
                          onClick={(e) => {
                            e.stopPropagation();
                            void onApprove(item.id);
                          }}
                        >
                          Approve
                        </Button>
                      ) : null}
                      {canRejectBooking(item) ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRejectModal(item.id);
                          }}
                        >
                          Reject
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <span className="text-xs text-foreground/60">No action</span>
                  )}
                </TableCell>
              </TableRow>
            ))}

            {items.length === 0 && !isListLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-foreground/60">
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
        {!selectedBooking && !isDetailLoading ? <p className="text-sm text-foreground/70">Select a booking to view complete details.</p> : null}

        {selectedBooking ? (
          <div className="grid gap-2 text-sm md:grid-cols-2">
            <p>
              <span className="font-medium">Booking ID:</span> {selectedBooking.id}
            </p>
            <p>
              <span className="font-medium">Requester:</span> {selectedBooking.userName}
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
            {selectedBooking.rejectionReason ? (
              <p className="md:col-span-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-700">
                <span className="font-medium">Rejection Reason:</span> {selectedBooking.rejectionReason}
              </p>
            ) : null}
          </div>
        ) : null}
      </Card>

      {isRejectModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg border border-border bg-background p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Reject Booking</h3>
            <p className="mt-1 text-sm text-foreground/70">Provide a clear rejection reason (minimum 10 characters).</p>

            <div className="mt-4">
              <label className="mb-1 block text-sm font-medium">Rejection Reason</label>
              <textarea
                className="min-h-24 w-full rounded-md border border-border/70 bg-background px-3 py-2 text-sm"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Example: Resource is under maintenance during this time slot."
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeRejectModal}>
                Cancel
              </Button>
              <Button type="button" variant="danger" onClick={() => void onRejectConfirm()} isLoading={isMutating}>
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
