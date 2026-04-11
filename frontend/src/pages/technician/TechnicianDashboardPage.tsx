import { Fragment, useEffect, useMemo, useState } from "react";
import TechnicianDashboardStats from "../../features/ticket/components/TechnicianDashboardStats";
import { ticketApi } from "../../core/api/ticketApi";
import { useAuthStore } from "../../core/store/authStore";
import { Card } from "../../shared/components/ui/Card";
import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';
import { Button } from "../../shared/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shared/components/ui/Table";
import type { AuditLogItem, Ticket } from "../../types/ticket";

const parseDurationToMinutes = (duration: string | null): number | null => {
  if (!duration) return null;
  if (!duration.startsWith("P")) return null;

  const timeSection = duration.includes("T") ? duration.split("T")[1] : "";
  const dayMatch = duration.match(/(\d+)D/);
  const hourMatch = timeSection.match(/(\d+)H/);
  const minuteMatch = timeSection.match(/(\d+)M/);

  const days = dayMatch ? Number(dayMatch[1]) : 0;
  const hours = hourMatch ? Number(hourMatch[1]) : 0;
  const minutes = minuteMatch ? Number(minuteMatch[1]) : 0;

  return days * 24 * 60 + hours * 60 + minutes;
};

const formatMinutes = (minutes: number | null): string => {
  if (minutes === null) return "N/A";
  if (minutes < 60) return `${minutes}m`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};

const isToday = (dateString: string | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};



export default function TechnicianDashboardPage() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpanded = (id: string): void => {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  };

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        const ticketsSummaryResponse = await ticketApi.listTickets({ page: 0, size: 1 });
        const totalAssigned = ticketsSummaryResponse.data.totalElements;
        const ticketsResponse = await ticketApi.listTickets({ page: 0, size: Math.max(totalAssigned, 1) });

        if (!isMounted) return;
        setTickets(ticketsResponse.data.content);

        try {
          const auditLogsResponse = await ticketApi.listAuditLogs({ page: 0, size: 6, userId: currentUserId });
          if (!isMounted) return;
          setAuditLogs(auditLogsResponse.data.content);
        } catch {
          if (!isMounted) return;
          setAuditLogs([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadDashboardData();
    const refreshTimer = window.setInterval(() => {
      void loadDashboardData();
    }, 60000);

    return () => {
      isMounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [currentUserId]);

  const dashboardMetrics = useMemo(() => {
    const assignedTickets = tickets.length;
    const openNow = tickets.filter((ticket) => ticket.status === "OPEN" || ticket.status === "IN_PROGRESS").length;
    const resolvedToday = tickets.filter((ticket) => isToday(ticket.resolvedAt)).length;

    const responseMinutes = tickets
      .map((ticket) => parseDurationToMinutes(ticket.timeToFirstResponse))
      .filter((value): value is number => value !== null);
    const avgResponseTime = responseMinutes.length
      ? Math.round(responseMinutes.reduce((sum, value) => sum + value, 0) / responseMinutes.length)
      : null;

    return {
      assignedTickets,
      openNow,
      resolvedToday,
      avgResponseTimeLabel: formatMinutes(avgResponseTime),
    };
  }, [tickets]);



  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="Technician Dashboard"
        description={loading ? "Loading technician metrics..." : "Prioritize assigned incidents and monitor SLA progress in real time."}
      />

      <TechnicianDashboardStats
        assignedTickets={dashboardMetrics.assignedTickets}
        openNow={dashboardMetrics.openNow}
        resolvedToday={dashboardMetrics.resolvedToday}
        avgResponseTimeLabel={dashboardMetrics.avgResponseTimeLabel}
      />

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Technician Audit Log</h2>
            <p className="text-sm text-foreground/70">Recent actions by the current technician account.</p>
          </div>
        </div>

        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead />
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.map((log) => (
                <Fragment key={log.id}>
                  <TableRow>
                    <TableCell>
                      <Button type="button" variant="ghost" size="sm" onClick={() => toggleExpanded(log.id)}>
                        {expandedIds[log.id] ? 'Hide' : 'View'}
                      </Button>
                    </TableCell>
                    <TableCell className="font-medium">{log.action}</TableCell>
                    <TableCell>{log.entityType}</TableCell>
                    <TableCell className="max-w-65 truncate" title={log.entityId}>{log.entityId}</TableCell>
                    <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                  </TableRow>
                  {expandedIds[log.id] ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                            <p className="mb-2 text-sm font-semibold">Old Value</p>
                            <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs text-foreground/80">
                              {log.oldValue ? JSON.stringify(log.oldValue, null, 2) : 'No previous value'}
                            </pre>
                          </div>
                          <div className="rounded-md border border-border/70 bg-muted/20 p-3">
                            <p className="mb-2 text-sm font-semibold">New Value</p>
                            <pre className="max-h-60 overflow-auto whitespace-pre-wrap text-xs text-foreground/80">
                              {log.newValue ? JSON.stringify(log.newValue, null, 2) : 'No new value'}
                            </pre>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              ))}
              {auditLogs.length === 0 && !loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-foreground/60">
                    No audit records for this technician yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>

        <div className="mt-3 text-sm text-foreground/70">
          Showing {auditLogs.length} audit logs
        </div>
      </Card>
    </div>
  );
}
