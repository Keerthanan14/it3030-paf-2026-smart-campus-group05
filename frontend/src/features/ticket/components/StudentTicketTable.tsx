import { Button } from "../../../shared/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/Table";
import { formatDurationLabel, getFirstResponseSlaTone, getResolutionSlaTone, getSlaLabel, getSlaToneClass } from "../utils/ticketUi";
import type { Ticket } from "../../../types/ticket";

type StudentTicketTableProps = {
  tickets: Ticket[];
  loading: boolean;
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onSelectTicket: (ticketId: string) => void;
  onSetPage: (page: number) => void;
  onSetSize: (size: number) => void;
};

const badgeTone: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-sky-100 text-sky-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-slate-200 text-slate-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

export function StudentTicketTable({
  tickets,
  loading,
  page,
  size,
  totalPages,
  totalElements,
  onSelectTicket,
  onSetPage,
  onSetSize,
}: StudentTicketTableProps) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((item) => (
            <TableRow key={item.id} className="cursor-pointer" onClick={() => onSelectTicket(item.id)}>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.priority}</TableCell>
              <TableCell>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeTone[item.status] || "bg-muted text-foreground"}`}>
                  {item.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="space-y-1">
                  <p className={`inline-block rounded px-2 py-0.5 text-xs ${getSlaToneClass(getFirstResponseSlaTone(item))}`}>
                    {getSlaLabel(getFirstResponseSlaTone(item))}: {formatDurationLabel(item.timeToFirstResponse)}
                  </p>
                  <p className={`inline-block rounded px-2 py-0.5 text-xs ${getSlaToneClass(getResolutionSlaTone(item))}`}>
                    {getSlaLabel(getResolutionSlaTone(item))}: {formatDurationLabel(item.timeToResolution)}
                  </p>
                </div>
              </TableCell>
              <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
            </TableRow>
          ))}
          {tickets.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-foreground/60">
                No tickets found.
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
          <select className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm" value={size} onChange={(e) => onSetSize(Number(e.target.value))}>
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

export default StudentTicketTable;
