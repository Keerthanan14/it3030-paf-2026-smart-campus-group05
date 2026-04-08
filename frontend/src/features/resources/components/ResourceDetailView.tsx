import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../../../core/store/authStore';
import { useResourceDetail } from '../hooks/useResourceDetail';
import { StickyPageHeader } from '../../../shared/components/ui/StickyPageHeader';
import { ResourceDetailCard } from './ResourceDetailCard';

function isAdminRole(role: string | undefined) {
  const normalized = (role ?? '').replace('ROLE_', '').toUpperCase();
  return normalized === 'ADMIN';
}

function getBackLink(userRole: string | undefined): string {
  const normalized = (userRole ?? '').replace('ROLE_', '').toLowerCase();
  if (normalized === 'admin') return '/admin/resources';
  if (normalized === 'technician') return '/technician/resources';
  return '/student/resources';
}

export function ResourceDetailView() {
  const { id } = useParams();
  const role = useAuthStore((state) => state.user?.role);
  const { resource, loading, error } = useResourceDetail(id);

  return (
    <div className="space-y-6">
      <StickyPageHeader
        title="Resource Detail"
        description="View complete resource information and availability actions."
        action={
          <Link to={getBackLink(role)} className="rounded-md border border-border/70 px-3 py-2 text-sm">
            Back to Resources
          </Link>
        }
      />

      {loading ? <div className="rounded-lg border border-border/60 bg-card p-4 text-sm">Loading resource...</div> : null}
      {error ? <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      {resource ? <ResourceDetailCard resource={resource} canManage={isAdminRole(role)} /> : null}
    </div>
  );
}