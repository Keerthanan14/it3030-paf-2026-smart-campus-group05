import { useEffect, useState } from 'react';
import { CalendarDays, Check, Copy, Download, FileText, Hash, QrCode, Users, XCircle, BadgeInfo } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Modal } from '../../../shared/components/ui/Modal';
import api from '../../../core/api/client';
import type { BookingItem } from '../../../types/booking';
import type { ResourceItem } from '../../../types/resource';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '');
const apiClientBasePath = '/api';

function resolveQrCodeUrl(qrCodeUrl: string | null): string | null {
  if (!qrCodeUrl) {
    return null;
  }

  if (qrCodeUrl.startsWith('http://') || qrCodeUrl.startsWith('https://')) {
    return qrCodeUrl;
  }

  return `${apiBaseUrl}${qrCodeUrl}`;
}

interface BookingDetailPanelProps {
  selectedBooking: BookingItem | null;
  isDetailLoading: boolean;
  resources: ResourceItem[];
  onClose: () => void;
}

const formatResourceType = (type: string): string => type.replace(/_/g, ' ');
const stripEquipmentSuffix = (label: string): string => label.replace(/\s+EQUIPMENT$/i, '');

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

export function BookingDetailPanel({ selectedBooking, isDetailLoading, resources, onClose }: BookingDetailPanelProps) {
  const isOpen = Boolean(selectedBooking || isDetailLoading);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const qrCodeSrc = resolveQrCodeUrl(selectedBooking?.qrCodeUrl ?? null);
  const [qrBlobState, setQrBlobState] = useState<{ source: string; blobUrl: string } | null>(null);
  const qrImageSrc = qrCodeSrc && qrBlobState?.source === qrCodeSrc ? qrBlobState.blobUrl : qrCodeSrc;

  const resourceLabel = (() => {
    if (!selectedBooking) {
      return '';
    }

    const resource = resources.find((entry) => entry.id === selectedBooking.resourceId);
    if (!resource) {
      return stripEquipmentSuffix(selectedBooking.resourceName);
    }

    if (resource.type === 'EQUIPMENT') {
      return resource.name;
    }

    return `${resource.name} ${formatResourceType(resource.type)}`;
  })();

  const dateTimeLabel = (() => {
    if (!selectedBooking) {
      return '';
    }

    const bookingDateValue = new Date(`${selectedBooking.bookingDate}T00:00:00`);
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

    return `${formattedDate} ${convertTo12Hour(selectedBooking.startTime)} – ${convertTo12Hour(selectedBooking.endTime)}`;
  })();

  const copyBookingId = async (): Promise<void> => {
    if (!selectedBooking?.id) {
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedBooking.id);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1500);
    } catch {
      setCopyState('idle');
    }
  };

  useEffect(() => {
    if (!qrCodeSrc) {
      return;
    }

    const absoluteApiPrefix = `${apiBaseUrl}${apiClientBasePath}`;
    const relativeApiPath = qrCodeSrc.startsWith(absoluteApiPrefix)
      ? qrCodeSrc.slice(absoluteApiPrefix.length)
      : qrCodeSrc.startsWith(apiClientBasePath)
        ? qrCodeSrc.slice(apiClientBasePath.length)
        : null;

    if (!relativeApiPath) {
      return;
    }

    let active = true;
    let blobUrl: string | null = null;

    api
      .get<Blob>(relativeApiPath, { responseType: 'blob' })
      .then((response) => {
        if (!active) {
          return;
        }

        blobUrl = URL.createObjectURL(response.data);
        setQrBlobState({ source: qrCodeSrc, blobUrl });
      });

    return () => {
      active = false;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [qrCodeSrc]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Booking Detail" className="max-w-3xl">
      {!selectedBooking ? (
        <p className="text-sm text-foreground/70">Loading booking details...</p>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
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
                <div className="flex items-start gap-2 border-b border-border/60 py-3">
                  <div className="rounded-xl bg-primary/10 p-2 text-primary">
                    <Hash className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/55">Booking ID</p>
                      <button
                        type="button"
                        onClick={copyBookingId}
                        aria-label="Copy booking ID"
                        title="Copy booking ID"
                        className="inline-flex items-center justify-center rounded-md border border-border/70 bg-background p-1.5 text-foreground transition-colors hover:bg-muted"
                      >
                        {copyState === 'copied' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                    <p className="break-all text-[10px] font-mono font-semibold leading-5 text-foreground sm:text-[12px]">{selectedBooking.id}</p>
                  </div>
                </div>

                <DetailRow icon={BadgeInfo} label="Resource" value={resourceLabel} />
                <DetailRow icon={CalendarDays} label="Date & Time" value={dateTimeLabel} />
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
            </div>

            <div className="rounded-3xl border border-border/70 bg-muted/20 p-4 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <QrCode className="h-5 w-5 text-primary" />
                <h3 className="text-sm font-semibold">Booking QR Code</h3>
              </div>
              <p className="mb-4 text-xs text-foreground/70">Present this QR code when using the resource</p>

              {qrImageSrc ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-white/50 p-4">
                  <img
                    src={qrImageSrc}
                    alt="Booking QR Code"
                    className="h-48 w-48 rounded-lg border border-border/30 object-contain"
                    loading="lazy"
                  />
                  <a
                    href={qrImageSrc}
                    download={`booking-${selectedBooking.id}.png`}
                    className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/20"
                  >
                    <Download className="h-4 w-4" />
                    Download QR Code
                  </a>
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-border/60 bg-white/50 p-8 text-center text-sm text-foreground/60">
                  QR code will appear after the booking is created.
                </div>
              )}
            </div>
          </div>

          {selectedBooking.status === 'REJECTED' ? (
            <div className="rounded-3xl border border-rose-200 bg-rose-50 p-4 text-rose-800 shadow-sm">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <XCircle className="h-4 w-4" />
                Reason for Rejection
              </div>
              <p className="text-sm leading-6">{selectedBooking.rejectionReason || 'No reason provided'}</p>
            </div>
          ) : null}
        </div>
      )}
    </Modal>
  );
}
