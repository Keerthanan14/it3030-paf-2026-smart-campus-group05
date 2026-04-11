import { Button } from "../../../shared/components/ui/Button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../shared/components/ui/Table";
import { formatDurationLabel, getFirstResponseSlaTone, getResolutionSlaTone, getSlaLabel, getSlaToneClass } from "../utils/ticketUi";
import type { Ticket, TicketStatus } from "../../../types/ticket";

type TechnicianTicketTableProps = {
  tickets: Ticket[];
  loading: boolean;
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  onSelectTicket: (ticketId: string) => void;
  onSetPage: (page: number) => void;
  onSetSize: (size: number) => void;
  onAdvanceStatus: (ticketId: string, nextStatus: TicketStatus) => void;
  rowStatusLoadingTicketId: string | null;
};

const statusTone: Record<string, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  IN_PROGRESS: "bg-sky-100 text-sky-800",
  RESOLVED: "bg-emerald-100 text-emerald-800",
  CLOSED: "bg-slate-200 text-slate-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

const getNextStatusForTicket = (status: TicketStatus): TicketStatus | null => {
  if (status === "OPEN") return "IN_PROGRESS";
  if (status === "IN_PROGRESS") return "RESOLVED";
  return null;
};

const getNextStatusLabel = (status: TicketStatus): string => {
  if (status === "IN_PROGRESS") return "Mark In Progress";
  if (status === "RESOLVED") return "Mark Resolved";
  return "Update Status";
};

export function TechnicianTicketTable({
  tickets,
  loading,
  page,
  size,
  totalPages,
  totalElements,
  onSelectTicket,
  onSetPage,
  onSetSize,
  onAdvanceStatus,
  rowStatusLoadingTicketId,
}: TechnicianTicketTableProps) {
  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>SLA</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tickets.map((item) => {
            const nextStatus = getNextStatusForTicket(item.status);
            const isRowLoading = rowStatusLoadingTicketId === item.id;
            return (
              <TableRow key={item.id} className="cursor-pointer" onClick={() => onSelectTicket(item.id)}>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.priority}</TableCell>
                <TableCell>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusTone[item.status] || "bg-muted text-foreground"}`}>
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
                <TableCell>
                  {nextStatus ? (
                    <button
                      type="button"
                      className="inline-flex items-center rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isRowLoading}
                      onClick={(event) => {
                        event.stopPropagation();
                        onAdvanceStatus(item.id, nextStatus);
                      }}
                    >
                      {isRowLoading ? "Updating..." : getNextStatusLabel(nextStatus)}
                    </button>
                  ) : (
                    <span className="text-xs text-foreground/60">-</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {tickets.length === 0 && !loading ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-foreground/60">
                No tickets assigned.
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

export default TechnicianTicketTable;
