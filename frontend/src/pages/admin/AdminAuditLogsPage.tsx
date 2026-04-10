import { useState } from 'react';
import { useTicketAuditLogs } from '../../features/ticket/hooks/useTicketAuditLogs';
import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';
import { Card } from '../../shared/components/ui/Card';
import { Input } from '../../shared/components/ui/Input';
import { Button } from '../../shared/components/ui/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../shared/components/ui/Table';

type AuditFilterDraft = {
  entityType: string;
  action: string;
  actorQuery: string;
};

export default function AdminAuditLogsPage() {
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
  } = useTicketAuditLogs();

  const [draftFilters, setDraftFilters] = useState<AuditFilterDraft>({
    entityType: '',
    action: '',
    actorQuery: '',
  });

  const onChangeDraft = (key: keyof AuditFilterDraft, value: string) => {
    setDraftFilters((current) => {
      const next = { ...current, [key]: value };

      if (key === 'entityType' || key === 'action') {
        applyFilters({
          entityType: next.entityType.trim() || undefined,
          action: next.action.trim() || undefined,
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
      />

      <Card className="p-5 space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
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
        </div>

        {error ? <p className="text-sm text-error">{error}</p> : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>Entity ID</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleItems.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="font-medium">{log.action}</TableCell>
                <TableCell>{log.entityType}</TableCell>
                <TableCell className="max-w-65 truncate" title={log.entityId}>{log.entityId}</TableCell>
                <TableCell>{log.userName ?? log.userEmail ?? 'System'}</TableCell>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
              </TableRow>
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
