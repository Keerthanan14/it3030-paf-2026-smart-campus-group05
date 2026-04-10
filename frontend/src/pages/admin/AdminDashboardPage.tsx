import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, CalendarClock, Ticket, Users } from 'lucide-react';
import { bookingApi } from '../../core/api/bookingApi';
import { resourceApi } from '../../core/api/resourceApi';
import { ticketApi } from '../../core/api/ticketApi';
import { useAuthStore } from '../../core/store/authStore';
import { userApi } from '../../core/api/userApi';
import { Card } from '../../shared/components/ui/Card';
import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';
import type { AuditLogItem } from '../../types/ticket';

type DashboardMetrics = {
  totalResources: number | null;
  activeResources: number | null;
  outOfServiceResources: number | null;
  totalBookings: number | null;
  pendingBookings: number | null;
  approvedBookings: number | null;
  rejectedBookings: number | null;
  cancelledBookings: number | null;
  openTickets: number | null;
  activeUsers: number | null;
};

const initialMetrics: DashboardMetrics = {
  totalResources: null,
  activeResources: null,
  outOfServiceResources: null,
  totalBookings: null,
  pendingBookings: null,
  approvedBookings: null,
  rejectedBookings: null,
  cancelledBookings: null,
  openTickets: null,
  activeUsers: null,
};

const formatCount = (value: number | null) => {
  if (value === null) {
    return '...';
  }

  return new Intl.NumberFormat('en-US').format(value);
};

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [adminLogs, setAdminLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardMetrics = async () => {
      try {
        const [resourcesSummaryResponse, bookingsSummaryResponse, ticketsResponse, usersResponse] = await Promise.all([
          resourceApi.listResources({ page: 0, size: 1 }),
          bookingApi.getBookings({ page: 0, size: 1 }),
          ticketApi.listTickets({ page: 0, size: 1, filters: { status: 'OPEN' } }),
          userApi.getAll(),
        ]);

        const [resourcesResponse, allBookingsResponse] = await Promise.all([
          resourceApi.listResources({ page: 0, size: Math.max(resourcesSummaryResponse.data.totalElements, 1) }),
          bookingApi.getBookings({ page: 0, size: Math.max(bookingsSummaryResponse.totalElements, 1) }),
        ]);

        const auditLogsResponse = await ticketApi.listAuditLogs({
          page: 0,
          size: 5,
          userId: currentUserId,
        });

        if (!isMounted) {
          return;
        }

        const resourceContent = resourcesResponse.data.content || [];
        const activeResources = resourceContent.filter((resource) => resource.status === 'ACTIVE').length;
        const outOfServiceResources = resourceContent.filter((resource) => resource.status === 'OUT_OF_SERVICE').length;

        const bookingContent = allBookingsResponse.content || [];
        const approvedBookings = bookingContent.filter((booking) => booking.status === 'APPROVED').length;
        const rejectedBookings = bookingContent.filter((booking) => booking.status === 'REJECTED').length;
        const cancelledBookings = bookingContent.filter((booking) => booking.status === 'CANCELLED').length;
        const pendingBookings = bookingContent.filter((booking) => booking.status === 'PENDING').length;

        setMetrics({
          totalResources: resourcesSummaryResponse.data.totalElements,
          activeResources,
          outOfServiceResources,
          totalBookings: bookingsSummaryResponse.totalElements,
          pendingBookings,
          approvedBookings,
          rejectedBookings,
          cancelledBookings,
          openTickets: ticketsResponse.data.totalElements,
          activeUsers: usersResponse.data.length,
        });
        setAdminLogs(auditLogsResponse.data.content);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardMetrics();
    const refreshTimer = window.setInterval(loadDashboardMetrics, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [currentUserId]);

  const stats = [
    {
      label: 'Resources',
      value: formatCount(metrics.totalResources),
      icon: Building2,
      detail: `Active ${formatCount(metrics.activeResources)} / Out of Service ${formatCount(metrics.outOfServiceResources)}`,
    },
    {
      label: 'Bookings',
      value: formatCount(metrics.totalBookings),
      icon: CalendarClock,
      detail: `Pending ${formatCount(metrics.pendingBookings)} / Approved ${formatCount(metrics.approvedBookings)} / Rejected ${formatCount(metrics.rejectedBookings)} / Cancelled ${formatCount(metrics.cancelledBookings)}`,
    },
    { label: 'Open Tickets', value: formatCount(metrics.openTickets), icon: Ticket },
    { label: 'Active Users', value: formatCount(metrics.activeUsers), icon: Users },
  ];

  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="Admin Dashboard"
        description={isLoading ? 'Loading live dashboard metrics...' : 'Monitor campus operations, approvals, and support flow in one place.'}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => (
          <Card key={item.label} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-foreground/70">{item.label}</p>
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-3 text-3xl font-bold">{item.value}</p>
            {'detail' in item ? <p className="mt-2 text-xs text-foreground/60">{item.detail}</p> : null}
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <button
              type="button"
              className="text-left text-lg font-semibold hover:text-primary"
              onClick={() => navigate('/admin/audit-logs')}
            >
              Admin Log
            </button>
            <p className="text-sm text-foreground/70">Recent system and admin activity.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              Latest {adminLogs.length}
            </span>
            <button
              type="button"
              className="rounded-md border border-border/70 px-3 py-1 text-xs font-medium text-foreground/80 hover:bg-muted/60"
              onClick={() => navigate('/admin/audit-logs')}
            >
              View all
            </button>
          </div>
        </div>

        <ul className="mt-4 space-y-3 text-sm">
          {adminLogs.map((log) => (
            <li key={log.id} className="flex flex-col gap-1 rounded-md bg-muted/30 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-medium text-foreground">{log.action}</span>
                <span className="ml-2 text-foreground/60">{log.entityType}: {log.entityId}</span>
              </div>
              <div className="text-foreground/70">
                {log.userName ?? log.userEmail ?? 'System'} · {new Date(log.createdAt).toLocaleString()}
              </div>
            </li>
          ))}
          {adminLogs.length === 0 && !isLoading ? (
            <li className="rounded-md bg-muted/30 p-3 text-center text-foreground/60">
              No admin logs available.
            </li>
          ) : null}
        </ul>
      </Card>

    </div>
  );
}
