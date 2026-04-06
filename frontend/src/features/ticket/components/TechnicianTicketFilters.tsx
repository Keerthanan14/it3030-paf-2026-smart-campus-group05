import { Button } from "../../../shared/components/ui/Button";
import type { TicketFilters, TicketStatus } from "../../../types/ticket";

type TechnicianTicketFiltersProps = {
  filters: TicketFilters;
  loading: boolean;
  onStatusChange: (status: TicketStatus | undefined) => void;
  onSlaBreachedChange: (enabled: boolean) => void;
  onRefresh: () => void;
};

const statusOptions: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED", "REJECTED"];

export function TechnicianTicketFilters({
  filters,
  loading,
  onStatusChange,
  onSlaBreachedChange,
  onRefresh,
}: TechnicianTicketFiltersProps) {
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
      <label className="inline-flex items-center gap-2 rounded-md border border-border/70 px-3 py-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(filters.slaBreached)}
          onChange={(e) => onSlaBreachedChange(e.target.checked)}
        />
        SLA breached only
      </label>
      <Button type="button" variant="outline" onClick={onRefresh} isLoading={loading}>
        Refresh
      </Button>
    </div>
  );
}

export default TechnicianTicketFilters;
