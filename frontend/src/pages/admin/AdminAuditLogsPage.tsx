import { Fragment, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTicketAuditLogs } from '../../features/ticket/hooks/useTicketAuditLogs';
import { useTicketAutoRefresh } from '../../features/ticket/hooks/useTicketAutoRefresh';
import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../shared/components/ui/Table';

type AuditFilterDraft = {
  entityType: string;
  action: string;
  actorQuery: string;
  fromDate: string;
  toDate: string;
};

function toStartOfDayIso(dateValue: string): string | undefined {
  return dateValue ? `${dateValue}T00:00:00` : undefined;
}

function toEndOfDayIso(dateValue: string): string | undefined {
  return dateValue ? `${dateValue}T23:59:59` : undefined;
}

export default function AdminAuditLogsPage() {
  const navigate = useNavigate();
  const {
    items,
    loading,
    error,
    page,
    size,
    totalPages,
    totalElements,
    setPage,
    setSize,
    applyFilters,
    refresh,
  } = useTicketAuditLogs();

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  useTicketAutoRefresh({
    enabled: true,
    intervalMs: 15000,
    onRefresh: refresh,
  });

  const [draftFilters, setDraftFilters] = useState<AuditFilterDraft>({
    entityType: '',
    action: '',
    actorQuery: '',
    fromDate: '',
    toDate: '',
  });

  const toggleExpanded = (id: string): void => {
    setExpandedIds((current) => ({ ...current, [id]: !current[id] }));
  };

  const onChangeDraft = (key: keyof AuditFilterDraft, value: string) => {
    setDraftFilters((current) => {
      const next = { ...current, [key]: value };

      if (key === 'entityType' || key === 'action' || key === 'fromDate' || key === 'toDate') {
        applyFilters({
          entityType: next.entityType.trim() || undefined,
          action: next.action.trim() || undefined,
          from: toStartOfDayIso(next.fromDate),
          to: toEndOfDayIso(next.toDate),
        });
      }

      return next;
    });
  };

  const actorQuery = draftFilters.actorQuery.trim().toLowerCase();

  const visibleItems = actorQuery
    ? items.filter((log) => {
        const actorName = (log.userName ?? '').toLowerCase();
        const actorEmail = (log.userEmail ?? '').toLowerCase();
        return actorName.includes(actorQuery) || actorEmail.includes(actorQuery);
      })
    : items;

  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="Admin Audit Logs"
        description="View all audit events with filters and pagination."
        action={
          <Button type="button" variant="outline" onClick={() => navigate('/admin/dashboard')}>
            Back to Dashboard
          </Button>
        }
      />

      <Card className="p-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-5">
          <Input
            label="Entity Type"
            placeholder="BOOKING, TICKET, RESOURCE"
            value={draftFilters.entityType}
            onChange={(event) => onChangeDraft('entityType', event.target.value)}
          />
          <Input
            label="Action"
            placeholder="CREATED, UPDATED, APPROVED"
            value={draftFilters.action}
            onChange={(event) => onChangeDraft('action', event.target.value)}
          />
          <Input
            label="Actor Name or Email"
            placeholder="e.g. nimal or nimal@campus.edu"
            value={draftFilters.actorQuery}
            onChange={(event) => onChangeDraft('actorQuery', event.target.value)}
          />
          <Input
            label="From"
            type="date"
            value={draftFilters.fromDate}
            onChange={(event) => onChangeDraft('fromDate', event.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={draftFilters.toDate}
            onChange={(event) => onChangeDraft('toDate', event.target.value)}
          />
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead />
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleItems.map((log) => (
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
                <TableCell>{log.userName ?? log.userEmail ?? 'System'}</TableCell>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
              </TableRow>
              {expandedIds[log.id] ? (
                <TableRow>
                  <TableCell colSpan={6}>
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
            {visibleItems.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-foreground/60">
                  No logs found for current filter.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground/70">
            Showing page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} total logs)
          </p>

          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm"
              value={size}
              onChange={(event) => setSize(Number(event.target.value))}
              disabled={loading}
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={loading || page <= 0}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={loading || totalPages === 0 || page >= totalPages - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
