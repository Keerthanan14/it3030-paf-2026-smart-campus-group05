import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/Table";
import type { AuditLogItem } from "../../../types/ticket";

type AdminTicketAuditTrailProps = {
  items: AuditLogItem[];
  loading: boolean;
  error: string | null;
  filters: {
    entityType?: string;
    action?: string;
    userId?: string;
  };
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onEntityTypeChange: (value: string | undefined) => void;
  onActionChange: (value: string | undefined) => void;
  onUserIdChange: (value: string | undefined) => void;
  onRefresh: () => void;
  onSetPage: (page: number) => void;
  onSetSize: (size: number) => void;
};

export function AdminTicketAuditTrail({
  items,
  loading,
  error,
  filters,
  page,
  size,
  totalPages,
  totalElements,
  onEntityTypeChange,
  onActionChange,
  onUserIdChange,
  onRefresh,
  onSetPage,
  onSetSize,
}: AdminTicketAuditTrailProps) {
  return (
    <>
      <h2 className="text-lg font-semibold">Audit Trail</h2>

      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Entity Type</label>
          <Input
            value={filters.entityType ?? ""}
            onChange={(e) => onEntityTypeChange(e.target.value || undefined)}
            placeholder="TICKET"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Action</label>
          <Input
            value={filters.action ?? ""}
            onChange={(e) => onActionChange(e.target.value || undefined)}
            placeholder="STATUS_UPDATED"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">User ID</label>
          <Input
            value={filters.userId ?? ""}
            onChange={(e) => onUserIdChange(e.target.value || undefined)}
            placeholder="actor user id"
          />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={onRefresh} isLoading={loading}>
            Refresh Logs
          </Button>
        </div>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Entity</TableHead>
            <TableHead>Actor</TableHead>
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.action}</TableCell>
              <TableCell>{item.entityType}:{item.entityId}</TableCell>
              <TableCell>{item.userName ?? item.userEmail ?? "System"}</TableCell>
              <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
          {items.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-foreground/60">
                No audit records found.
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
            onChange={(e) => onSetSize(Number(e.target.value))}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
          <Button type="button" variant="outline" size="sm" onClick={() => onSetPage(page - 1)} disabled={page <= 0 || loading}>
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSetPage(page + 1)}
            disabled={loading || totalPages === 0 || page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </>
  );
}

export default AdminTicketAuditTrail;
