import { useEffect, useState } from 'react';
import { BadgeInfo, CalendarDays, FileText, Hash, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../../shared/components/ui/Button';
import { Card } from '../../shared/components/ui/Card';
import { Input } from '../../shared/components/ui/Input';
import { Modal } from '../../shared/components/ui/Modal';
import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../shared/components/ui/Table';
import { useToast } from '../../shared/components/ui/useToast';
import { useBookingStore } from '../../core/store/bookingStore';
import { resourceApi } from '../../core/api/resourceApi';
import type { BookingApiError, BookingItem, BookingStatus } from '../../types/booking';
import type { ResourceType } from '../../types/resource';

const badgeTone: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-slate-200 text-slate-800',
};

const formatResourceType = (type: ResourceType): string =>
  type
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const stripKnownTypeSuffix = (label: string): string =>
  label.replace(/\s+(ROOM|LECTURE\s+HALL|LAB|MEETING\s+ROOM|BOARD\s+ROOM|STAFF\s+ROOM|SMART\s+CLASSROOM|EQUIPMENT|STUDY\s+AREA|LIBRARY|OTHER)$/i, '').trim();

const formatResourceLabel = (label: string, resourceType?: ResourceType): string => {
  const normalized = label.trim().replace(/\s+/g, ' ');
  const baseName = stripKnownTypeSuffix(normalized);

  if (resourceType === 'EQUIPMENT') {
    return baseName || normalized;
  }

  if (resourceType) {
    return `${baseName || normalized} ${formatResourceType(resourceType)}`;
  }

  if (/\s+EQUIPMENT$/i.test(normalized)) {
    return normalized.replace(/\s+EQUIPMENT$/i, '').trim();
  }

  if (/\s+STUDY\s+AREA$/i.test(normalized)) {
    const baseName = normalized.replace(/\s+STUDY\s+AREA$/i, '').trim();
    return `${baseName ? `${baseName} ` : ''}Study area`;
  }

  return normalized;
};

function DetailRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 border-b border-border/60 py-3 last:border-b-0">
      <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">{label}</p>
        <p className="wrap-break-word whitespace-pre-line text-[10px] font-semibold text-foreground sm:text-[12px]">{value}</p>
      </div>
    </div>
  );
}

function DetailRowDouble({
  icon1: Icon1,
  label1,
  value1,
  icon2: Icon2,
  label2,
  value2,
}: {
  icon1: LucideIcon;
  label1: string;
  value1: string;
  icon2: LucideIcon;
  label2: string;
  value2: string;
}) {
  return (
    <div className="border-b border-border/60 py-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-start gap-2">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Icon1 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">{label1}</p>
            <p className="wrap-break-word whitespace-pre-line text-[10px] font-semibold text-foreground sm:text-[12px]">{value1}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
            <Icon2 className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-foreground/55">{label2}</p>
            <p className="wrap-break-word whitespace-pre-line text-[10px] font-semibold text-foreground sm:text-[12px]">{value2}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

const formatBookingDateTime = (booking: BookingItem): string => {
  const bookingDateValue = new Date(`${booking.bookingDate}T00:00:00`);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(bookingDateValue);

  const convertTo12Hour = (time24: string): string => {
    const [hours, minutes] = time24.substring(0, 5).split(':');
    const hour = parseInt(hours, 10);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${period}`;
  };

  return `${formattedDate} ${convertTo12Hour(booking.startTime)} – ${convertTo12Hour(booking.endTime)}`;
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
  const [resourceTypeById, setResourceTypeById] = useState<Record<string, ResourceType>>({});
  const [rowActionState, setRowActionState] = useState<{ bookingId: string; action: 'approve' | 'reject' } | null>(null);

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
    setSelectedBooking,
  } = useBookingStore();

  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectBookingId, setRejectBookingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    void fetchBookings();
  }, [fetchBookings, page, size, filters]);

  useEffect(() => {
    const resourceIds = Array.from(
      new Set(
        [...items.map((item) => item.resourceId), selectedBooking?.resourceId]
          .filter((value): value is string => Boolean(value))
      )
    );

    const missingResourceIds = resourceIds.filter((id) => !resourceTypeById[id]);
    if (missingResourceIds.length === 0) {
      return;
    }

    let active = true;
    Promise.all(
      missingResourceIds.map(async (id) => {
        const response = await resourceApi.getResourceById(id);
        return { id, type: response.data.type as ResourceType };
      })
    )
      .then((resolved) => {
        if (!active) {
          return;
        }

        setResourceTypeById((prev) => {
          const next = { ...prev };
          resolved.forEach(({ id, type }) => {
            next[id] = type;
          });
          return next;
        });
      })
      .catch(() => {
        // Keep existing formatting fallback when resource lookup fails.
      });

    return () => {
      active = false;
    };
  }, [items, selectedBooking, resourceTypeById]);

  const onSelectBooking = async (id: string): Promise<void> => {
    clearError();
    await fetchBookingById(id);
  };

  const onApprove = async (id: string): Promise<void> => {
    setRowActionState({ bookingId: id, action: 'approve' });
    try {
      const updated = await approveBooking(id);
      toast.success('Booking approved', `Booking ${updated.id.slice(0, 8)} has been approved.`);
      await fetchBookings();
      await fetchBookingById(id);
    } catch (caught: unknown) {
      const apiError = (caught as BookingApiError) || error;
      toast.error('Approve failed', toErrorMessage(apiError, 'Could not approve booking.'));
    } finally {
      setRowActionState((current) => (current?.bookingId === id && current.action === 'approve' ? null : current));
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

    setRowActionState({ bookingId: rejectBookingId, action: 'reject' });

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
    } finally {
      setRowActionState((current) => (current?.bookingId === rejectBookingId && current.action === 'reject' ? null : current));
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
      <StickyPageHeader
        title="Booking Management"
        description="Review pending bookings, then approve or reject with a clear reason."
      />

      <Card className="space-y-4 p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
          <div className="w-full xl:min-w-60 xl:flex-1">
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

          <div className="w-full xl:min-w-60 xl:flex-1">
            <Input
              label="From"
              type="date"
              value={filters.from ?? ''}
              onChange={(e) => patchFilters({ from: e.target.value || undefined })}
            />
          </div>

          <div className="w-full xl:min-w-60 xl:flex-1">
            <Input
              label="To"
              type="date"
              value={filters.to ?? ''}
              onChange={(e) => patchFilters({ to: e.target.value || undefined })}
            />
          </div>

          <div className="flex w-full flex-wrap gap-2 xl:ml-auto xl:w-auto xl:justify-end">
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
                <TableCell>{formatResourceLabel(item.resourceName, resourceTypeById[item.resourceId])}</TableCell>
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
                          isLoading={rowActionState?.bookingId === item.id && rowActionState.action === 'approve'}
                          disabled={Boolean(rowActionState)}
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
                          disabled={Boolean(rowActionState)}
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

      <Modal
        isOpen={Boolean(selectedBooking || isDetailLoading)}
        onClose={() => setSelectedBooking(null)}
        title="Booking Detail"
        className="max-w-xl"
      >
        {!selectedBooking ? <p className="text-sm text-foreground/70">Loading booking details...</p> : null}

        {selectedBooking ? (
          <div className="rounded-3xl border border-border/70 bg-linear-to-br from-background via-muted/20 to-primary/5 p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/55">Booking Summary</p>
                <p className="text-sm text-foreground/70">Review the selected booking request details</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${selectedBooking.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : selectedBooking.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : selectedBooking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}>
                {selectedBooking.status}
              </span>
            </div>

            <div className="rounded-2xl border border-border/60 bg-white/75 px-4 shadow-sm">
              <DetailRow icon={Hash} label="Booking ID" value={selectedBooking.id} />
              <DetailRow icon={BadgeInfo} label="Requester" value={selectedBooking.userName} />
              <DetailRow
                icon={BadgeInfo}
                label="Resource"
                value={formatResourceLabel(selectedBooking.resourceName, resourceTypeById[selectedBooking.resourceId])}
              />
              <DetailRow icon={CalendarDays} label="Date & Time" value={formatBookingDateTime(selectedBooking)} />
              <DetailRowDouble
                icon1={Users}
                label1="Count"
                value1={String(selectedBooking.attendeesCount)}
                icon2={BadgeInfo}
                label2="Status"
                value2={selectedBooking.status}
              />
              <DetailRow icon={FileText} label="Purpose" value={selectedBooking.purpose} />
            </div>

            {selectedBooking.rejectionReason ? (
              <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm">
                <div className="mb-2 text-sm font-semibold">Reason for Rejection</div>
                <p className="text-sm leading-6">{selectedBooking.rejectionReason}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

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
              <Button
                type="button"
                variant="danger"
                onClick={() => void onRejectConfirm()}
                isLoading={Boolean(rejectBookingId && rowActionState?.bookingId === rejectBookingId && rowActionState.action === 'reject')}
              >
                Confirm Reject
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
