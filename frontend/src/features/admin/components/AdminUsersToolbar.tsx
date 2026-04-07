import { FileText, Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import type { StaffRoleFilter, UserTabFilter } from '../../../types/user';
import type { UsePaginationResult } from '../../../core/hooks/usePagination';

type AdminUsersToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  tab: UserTabFilter;
  staffRoleFilter: StaffRoleFilter;
  onStaffRoleFilterChange: (value: StaffRoleFilter) => void;
  onOpenCreateModal: () => void;
  onOpenReportModal: () => void;
  onRefresh: () => void;
  loading: boolean;
  pagination: UsePaginationResult;
  filteredCount: number;
};

export function AdminUsersToolbar({
  search,
  onSearchChange,
  tab,
  staffRoleFilter,
  onStaffRoleFilterChange,
  onOpenCreateModal,
  onOpenReportModal,
  onRefresh,
  loading,
  pagination,
  filteredCount,
}: AdminUsersToolbarProps) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto] lg:items-end">
        <Input
          label="Search"
          placeholder="Search by name or email"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />

        {tab === 'STAFF' ? (
          <div>
            <label className="mb-1 block text-sm font-medium">Staff Role</label>
            <select
              className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
              value={staffRoleFilter}
              onChange={(event) => onStaffRoleFilterChange(event.target.value as StaffRoleFilter)}
            >
              <option value="ALL">All Staff</option>
              <option value="ADMIN">Admin</option>
              <option value="TECHNICIAN">Technician</option>
            </select>
          </div>
        ) : (
          <div />
        )}

        <Button type="button" variant="outline" onClick={onRefresh} isLoading={loading} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>

        <Button type="button" variant="outline" onClick={onOpenReportModal} className="gap-2">
          <FileText className="h-4 w-4" />
          Report
        </Button>

        <Button type="button" onClick={onOpenCreateModal} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Staff
        </Button>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/30 px-3 py-2">
        <span className="text-xs text-foreground/70">
          Showing {filteredCount === 0 ? 0 : pagination.offset + 1}–{Math.min(pagination.offset + pagination.pageSize, filteredCount)} of {filteredCount} users
        </span>
        
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={pagination.previousPage}
            disabled={!pagination.hasPreviousPage}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <span className="text-xs font-medium px-2">
            Page {pagination.totalPages === 0 ? 0 : pagination.page + 1} of {pagination.totalPages}
          </span>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={pagination.nextPage}
            disabled={!pagination.hasNextPage}
            className="gap-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AdminUsersToolbar;
