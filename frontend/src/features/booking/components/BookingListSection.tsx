import { Button } from '../../../shared/components/ui/Button';
import { Card } from '../../../shared/components/ui/Card';
import { Input } from '../../../shared/components/ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../shared/components/ui/Table';
import type { BookingFilters, BookingItem, BookingStatus } from '../../../types/booking';
import type { ResourceItem } from '../../../types/resource';

interface BookingListSectionProps {
  items: BookingItem[];
  resources: ResourceItem[];
  filters: BookingFilters;
  page: number;
  size: number;
  totalPages: number;
  totalElements: number;
  isListLoading: boolean;
  isMutating: boolean;
  onStatusChange: (status: BookingStatus | undefined) => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  onRefresh: () => void;
  onSelectBooking: (id: string) => void;
  onCancelBooking: (id: string) => void;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
}

const badgeTone: Record<BookingStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-rose-100 text-rose-800',
  CANCELLED: 'bg-slate-200 text-slate-800',
};

const formatResourceType = (type: string): string => type.replace(/_/g, ' ');
const stripEquipmentSuffix = (label: string): string => label.replace(/\s+EQUIPMENT$/i, '');

export function BookingListSection({
  items,
  resources,
  filters,
  page,
  size,
  totalPages,
  totalElements,
  isListLoading,
  isMutating,
  onStatusChange,
  onFromChange,
  onToChange,
  onRefresh,
  onSelectBooking,
  onCancelBooking,
  onPageChange,
  onSizeChange,
}: BookingListSectionProps) {
  const renderResourceLabel = (item: BookingItem): string => {
    const resource = resources.find((entry) => entry.id === item.resourceId);
    if (!resource) {
      return stripEquipmentSuffix(item.resourceName);
    }
    if (resource.type === 'EQUIPMENT') {
      return resource.name;
    }
    return `${resource.name} ${formatResourceType(resource.type)}`;
  };

  return (
    <Card className="space-y-4 p-5">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-sm font-medium">Status</label>
          <select
            className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
            value={filters.status ?? ''}
            onChange={(e) => onStatusChange((e.target.value || undefined) as BookingStatus | undefined)}
          >
            <option value="">All</option>
            <option value="PENDING">PENDING</option>
            <option value="APPROVED">APPROVED</option>
            <option value="REJECTED">REJECTED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>

        <div className="min-w-40 flex-1">
          <Input label="From" type="date" value={filters.from ?? ''} onChange={(e) => onFromChange(e.target.value)} />
        </div>

        <div className="min-w-40 flex-1">
          <Input label="To" type="date" value={filters.to ?? ''} onChange={(e) => onToChange(e.target.value)} />
        </div>

        <Button type="button" variant="outline" onClick={onRefresh} isLoading={isListLoading}>
          Refresh
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Resource</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Time</TableHead>
            <TableHead>Count</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id} className="cursor-pointer" onClick={() => onSelectBooking(item.id)}>
              <TableCell>{renderResourceLabel(item)}</TableCell>
              <TableCell>{item.bookingDate}</TableCell>
              <TableCell>
                {item.startTime} - {item.endTime}
              </TableCell>
              <TableCell>{item.attendeesCount}</TableCell>
              <TableCell>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${badgeTone[item.status]}`}>{item.status}</span>
              </TableCell>
              <TableCell>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCancelBooking(item.id);
                  }}
                  isLoading={isMutating}
                >
                  Cancel
                </Button>
              </TableCell>
            </TableRow>
          ))}

          {items.length === 0 && !isListLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-foreground/60">
                No bookings found.
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
          <select className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm" value={size} onChange={(e) => onSizeChange(Number(e.target.value))}>
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
          <Button type="button" variant="outline" size="sm" onClick={() => onPageChange(page - 1)} disabled={page <= 0 || isListLoading}>
            Previous
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={isListLoading || totalPages === 0 || page >= totalPages - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
}
