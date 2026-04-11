import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarCheck, Clock3, Ticket, CheckCircle2 } from 'lucide-react';
import { Card } from '../../shared/components/ui/Card';
import { Button } from '../../shared/components/ui/Button';
import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../shared/components/ui/Table';
import { bookingApi } from '../../core/api/bookingApi';
import ticketApi from '../../core/api/ticketApi';
import { useAuthStore } from '../../core/store/authStore';
import { formatRelativeTime } from '../../core/utils/formatDate';
import type { BookingItem, BookingStatus } from '../../types/booking';
import type { Ticket as SupportTicket, TicketStatus } from '../../types/ticket';

const bookingStatusTone: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-slate-200 text-slate-800',
};

const ticketStatusTone: Record<TicketStatus, string> = {
  OPEN: 'bg-amber-100 text-amber-800',
  IN_PROGRESS: 'bg-sky-100 text-sky-800',
  RESOLVED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-slate-200 text-slate-800',
  REJECTED: 'bg-rose-100 text-rose-800',
};

function formatBookingSchedule(booking: BookingItem): string {
  const bookingDate = new Date(`${booking.bookingDate}T${booking.startTime}`);

  if (Number.isNaN(bookingDate.getTime())) {
    return `${booking.bookingDate} ${booking.startTime} - ${booking.endTime}`;
  }

  return `${bookingDate.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} • ${booking.startTime} - ${booking.endTime}`;
}

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [bookingTotalElements, setBookingTotalElements] = useState(0);
  const [ticketTotalElements, setTicketTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id) {
      setBookings([]);
      setTickets([]);
      setBookingTotalElements(0);
      setTicketTotalElements(0);
      setLoading(false);
      return;
    }

    let active = true;

    const loadDashboard = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      const [bookingResult, ticketResult] = await Promise.allSettled([
        bookingApi.getBookings({ page: 0, size: 100 }),
        ticketApi.listTickets({ page: 0, size: 100 }),
      ]);

      if (!active) {
        return;
      }

      const failures: string[] = [];

      if (bookingResult.status === 'fulfilled') {
        setBookings(bookingResult.value.content);
        setBookingTotalElements(bookingResult.value.totalElements);
      } else {
        failures.push('bookings');
      }

      if (ticketResult.status === 'fulfilled') {
        setTickets(ticketResult.value.data.content);
        setTicketTotalElements(ticketResult.value.data.totalElements);
      } else {
        failures.push('tickets');
      }

      if (failures.length === 2) {
        setError('Could not load your dashboard data. Please try again.');
      } else if (failures.length === 1) {
        setError(`Some dashboard data could not be loaded (${failures[0]}).`);
      }

      setLoading(false);
    };

    void loadDashboard();

    return () => {
      active = false;
    };
  }, [currentUser?.id]);

  const openTicketsCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS').length,
    [tickets]
  );

  const resolvedTicketsCount = useMemo(
    () => tickets.filter((ticket) => ticket.status === 'RESOLVED' || ticket.status === 'CLOSED').length,
    [tickets]
  );

  const upcomingBookings = useMemo(() => {
    return [...bookings]
      .filter((booking) => booking.status === 'PENDING' || booking.status === 'APPROVED')
      .sort((left, right) => {
        const leftTime = new Date(`${left.bookingDate}T${left.startTime}`).getTime();
        const rightTime = new Date(`${right.bookingDate}T${right.startTime}`).getTime();
        return leftTime - rightTime;
      })
      .slice(0, 4);
  }, [bookings]);

  const recentTickets = useMemo(() => tickets.slice(0, 5), [tickets]);

  const stats = [
    { label: 'My Bookings', value: bookingTotalElements, icon: CalendarCheck },
    { label: 'My Tickets', value: ticketTotalElements, icon: Ticket },
    { label: 'Open Tickets', value: openTicketsCount, icon: Clock3 },
    { label: 'Resolved Tickets', value: resolvedTicketsCount, icon: CheckCircle2 },
  ];

  const displayName = currentUser?.name?.trim() || 'Student';

  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="Student Dashboard"
        description={`Welcome back, ${displayName}. Track your bookings and support requests from one clean workspace.`}
      />

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}
      {loading ? <p className="text-sm text-foreground/60">Loading your personalized dashboard data...</p> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground/70">{item.label}</p>
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold">{loading ? '—' : item.value}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Upcoming Bookings</h2>
              <p className="text-sm text-foreground/60">Your nearest approved or pending reservations.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate('/student/bookings')}>
              View Bookings
            </Button>
          </div>

          <ul className="mt-4 space-y-3 text-sm">
            {upcomingBookings.map((booking) => (
              <li key={booking.id} className="flex items-start justify-between gap-3 rounded-md bg-muted/30 p-3">
                <div>
                  <p className="font-medium text-foreground">{booking.resourceName}</p>
                  <p className="text-xs text-foreground/60">{formatBookingSchedule(booking)}</p>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${bookingStatusTone[booking.status]}`}>{booking.status}</span>
              </li>
            ))}

            {!loading && upcomingBookings.length === 0 ? (
              <li className="rounded-md border border-dashed border-border/70 bg-background/60 p-4 text-center text-sm text-foreground/60">
                No upcoming bookings found.
              </li>
            ) : null}
          </ul>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">My Recent Tickets</h2>
              <p className="text-sm text-foreground/60">Current support requests for your account.</p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={() => navigate('/student/tickets')}>
              View Tickets
            </Button>
          </div>

          <div className="mt-4 overflow-hidden rounded-lg border border-border/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{ticket.category}</p>
                        <p className="text-xs text-foreground/60">{ticket.id}</p>
                      </div>
                    </TableCell>
                    <TableCell>{ticket.priority}</TableCell>
                    <TableCell>
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${ticketStatusTone[ticket.status]}`}>{ticket.status}</span>
                    </TableCell>
                    <TableCell>{ticket.assignedToName ?? 'Unassigned'}</TableCell>
                    <TableCell>{formatRelativeTime(ticket.updatedAt)}</TableCell>
                  </TableRow>
                ))}

                {!loading && recentTickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-foreground/60">
                      No tickets found for this student.
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
