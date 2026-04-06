import { Button } from "../../../shared/components/ui/Button";
import { Input } from "../../../shared/components/ui/Input";
import type { TicketPriority, TicketStatus } from "../../../types/ticket";

type AdminTicketFiltersProps = {
  status: TicketStatus | undefined;
  priority: TicketPriority | undefined;
  assignedToFilter: string;
  loading: boolean;
  onStatusChange: (status: TicketStatus | undefined) => void;
  onPriorityChange: (priority: TicketPriority | undefined) => void;
  onAssignedToFilterChange: (value: string) => void;
  onApplyAssignedFilter: () => void;
  onRefresh: () => void;
};

const statusOptions: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];
const priorityOptions: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

export function AdminTicketFilters({
  status,
  priority,
  assignedToFilter,
  loading,
  onStatusChange,
  onPriorityChange,
  onAssignedToFilterChange,
  onApplyAssignedFilter,
  onRefresh,
}: AdminTicketFiltersProps) {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Status</label>
        <select
          className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
          value={status ?? ""}
          onChange={(e) => onStatusChange((e.target.value || undefined) as TicketStatus | undefined)}
        >
          <option value="">All</option>
          {statusOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Priority</label>
        <select
          className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
          value={priority ?? ""}
          onChange={(e) => onPriorityChange((e.target.value || undefined) as TicketPriority | undefined)}
        >
          <option value="">All</option>
          {priorityOptions.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Assigned To (ID)"
        value={assignedToFilter}
        onChange={(e) => onAssignedToFilterChange(e.target.value)}
        placeholder="technician user id"
      />

      <div className="flex items-end gap-2">
        <Button type="button" variant="outline" onClick={onApplyAssignedFilter}>
          Apply
        </Button>
        <Button type="button" variant="outline" onClick={onRefresh} isLoading={loading}>
          Refresh
        </Button>
      </div>
    </div>
  );
}

export default AdminTicketFilters;
