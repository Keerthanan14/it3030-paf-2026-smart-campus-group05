import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BadgeInfo, CalendarDays, FileText, Hash, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '../shared/components/ui/Button';
import bookingApi from '../core/api/bookingApi';
import type { BookingItem } from '../types/booking';

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

export default function BookingScanResultPage() {
  const navigate = useNavigate();
  const { bookingId } = useParams<{ bookingId: string }>();
  const hasValidBookingId = Boolean(bookingId);
  const [booking, setBooking] = useState<BookingItem | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadedBookingId, setLoadedBookingId] = useState<string | null>(null);

  useEffect(() => {
    if (!hasValidBookingId || !bookingId) {
      return;
    }

    let mounted = true;

    bookingApi
      .getBookingById(bookingId)
      .then((result) => {
        if (!mounted) {
          return;
        }
        setBooking(result);
        setErrorMessage(null);
        setLoadedBookingId(bookingId);
      })
      .catch((error: { message?: string }) => {
        if (!mounted) {
          return;
        }
        setBooking(null);
        setErrorMessage(error?.message || 'Unable to load booking details from this QR code.');
        setLoadedBookingId(bookingId);
      });

    return () => {
      mounted = false;
    };
  }, [bookingId, hasValidBookingId]);

  const isLoading = hasValidBookingId && loadedBookingId !== bookingId;

  const dateTimeLabel = useMemo(() => {
    if (!booking) {
      return '';
    }

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

    return `${formattedDate} ${convertTo12Hour(booking.startTime)} - ${convertTo12Hour(booking.endTime)}`;
  }, [booking]);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Booking Detail</h1>
        <Button type="button" variant="ghost" onClick={() => navigate(-1)} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-foreground/70">Loading booking details...</p> : null}

      {!isLoading && !hasValidBookingId ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          Invalid booking QR link.
        </div>
      ) : null}

      {!isLoading && hasValidBookingId && errorMessage ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{errorMessage}</div>
      ) : null}

      {!isLoading && !errorMessage && booking ? (
        <div className="rounded-3xl border border-border/70 bg-linear-to-br from-background via-muted/20 to-primary/5 p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-foreground/55">Booking Summary</p>
              <p className="text-sm text-foreground/70">Review the selected booking request details</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${booking.status === 'REJECTED' ? 'bg-rose-100 text-rose-700' : booking.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : booking.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-700'}`}
            >
              {booking.status}
            </span>
          </div>

          <div className="rounded-2xl border border-border/60 bg-white/75 px-4 shadow-sm">
            <DetailRow icon={Hash} label="Booking ID" value={booking.id} />
            <DetailRow icon={BadgeInfo} label="Resource" value={booking.resourceName} />
            <DetailRow icon={CalendarDays} label="Date & Time" value={dateTimeLabel} />
            <DetailRowDouble
              icon1={Users}
              label1="Count"
              value1={String(booking.attendeesCount)}
              icon2={BadgeInfo}
              label2="Status"
              value2={booking.status}
            />
            <DetailRow icon={FileText} label="Purpose" value={booking.purpose} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
