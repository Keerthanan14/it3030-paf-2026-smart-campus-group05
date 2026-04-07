import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { Modal } from '../../../shared/components/ui/Modal';
import type { UserReportFilters } from '../../../types/user';

type AdminUsersReportModalProps = {
  isOpen: boolean;
  filters: UserReportFilters;
  previewCount: number;
  onClose: () => void;
  onFiltersChange: (nextFilters: UserReportFilters) => void;
  onGenerateCsv: () => void;
  onGeneratePdf: () => void;
};

export function AdminUsersReportModal({
  isOpen,
  filters,
  previewCount,
  onClose,
  onFiltersChange,
  onGenerateCsv,
  onGeneratePdf,
}: AdminUsersReportModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Generate User Report" className="max-w-2xl">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Role Scope</label>
            <select
              className="h-10 w-full rounded-md border border-border/70 bg-background px-3 text-sm"
              value={filters.roleScope}
              onChange={(event) => onFiltersChange({ ...filters, roleScope: event.target.value as UserReportFilters['roleScope'] })}
            >
              <option value="ALL">All Users</option>
              <option value="STUDENT">Student</option>
              <option value="STAFF">Staff</option>
              <option value="ADMIN">Admin</option>
              <option value="TECHNICIAN">Technician</option>
            </select>
          </div>

          <Input
            label="Search"
            placeholder="name or email"
            value={filters.search}
            onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
          />

          <Input
            type="date"
            label="From"
            value={filters.fromDate}
            onChange={(event) => onFiltersChange({ ...filters, fromDate: event.target.value })}
          />

          <Input
            type="date"
            label="To"
            value={filters.toDate}
            onChange={(event) => onFiltersChange({ ...filters, toDate: event.target.value })}
          />
        </div>

        <p className="text-sm text-foreground/70">Matching users: {previewCount}</p>

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button type="button" variant="outline" onClick={onGenerateCsv}>
            Generate CSV
          </Button>
          <Button type="button" onClick={onGeneratePdf}>
            Generate PDF
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default AdminUsersReportModal;
