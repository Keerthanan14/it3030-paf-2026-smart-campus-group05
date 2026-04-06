import { Button } from "../../../shared/components/ui/Button";
import type { TicketFilters, TicketPriority, TicketStatus } from "../../../types/ticket";

type StudentTicketFiltersProps = {
  filters: TicketFilters;
  loading: boolean;
  onStatusChange: (status: TicketStatus | undefined) => void;
  onPriorityChange: (priority: TicketPriority | undefined) => void;
  onRefresh: () => void;
};

const statusOptions: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];
const priorityOptions: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function StudentTicketFilters({ filters, loading, onStatusChange, onPriorityChange, onRefresh }: StudentTicketFiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-40 flex-1">
        <label className="mb-1 block text-sm font-medium">Status</label>
        <select
          className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
          value={filters.status ?? ""}
          onChange={(e) => onStatusChange((e.target.value || undefined) as TicketStatus | undefined)}
        >
          <option value="">All</option>
          {statusOptions.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>
      <div className="min-w-40 flex-1">
        <label className="mb-1 block text-sm font-medium">Priority</label>
        <select
          className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
          value={filters.priority ?? ""}
          onChange={(e) => onPriorityChange((e.target.value || undefined) as TicketPriority | undefined)}
        >
          <option value="">All</option>
          {priorityOptions.map((priority) => (
            <option key={priority} value={priority}>
              {priority}
            </option>
          ))}
        </select>
      </div>
      <Button type="button" variant="outline" onClick={onRefresh} isLoading={loading}>
        Refresh
      </Button>
    </div>
  );
}

export default StudentTicketFilters;
