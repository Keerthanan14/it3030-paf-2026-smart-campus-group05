import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';
import AdminUsersManagementPanel from '../../features/admin/components/AdminUsersManagementPanel';

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="User Management"
        description="Manage campus users, roles, and access permissions."
      />

      <AdminUsersManagementPanel />
    </div>
  );
}
