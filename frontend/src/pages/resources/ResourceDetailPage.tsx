import { Link, useParams } from 'react-router-dom';
import { useAuthStore } from '../../core/store/authStore';
import { ResourceDetailCard } from '../../features/resources/components/ResourceDetailCard';
import { useResourceDetail } from '../../features/resources/hooks/useResourceDetail';

function isAdminRole(role: string | undefined) {
  const normalized = (role ?? '').replace('ROLE_', '').toUpperCase();
  return normalized === 'ADMIN';
}

export default function ResourceDetailPage() {
  const { id } = useParams();
  const role = useAuthStore((state) => state.user?.role);
  const { resource, loading, error } = useResourceDetail(id);

  const getBackLink = (userRole: string | undefined): string => {
    const normalized = (userRole ?? '').replace('ROLE_', '').toLowerCase();
    if (normalized === 'admin') return '/admin/resources/browse';
    if (normalized === 'technician') return '/technician/resources';
    return '/student/resources';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Resource Detail</h1>
          <p className="mt-1 text-sm text-foreground/70">View complete resource information and availability actions.</p>
        </div>
        <Link to={getBackLink(role)} className="rounded-md border border-border/70 px-3 py-2 text-sm">
          Back to Resources
        </Link>
      </div>
      <hr className="-mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />

      {loading ? <div className="rounded-lg border border-border/60 bg-card p-4 text-sm">Loading resource...</div> : null}
      {error ? <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      {resource ? <ResourceDetailCard resource={resource} canManage={isAdminRole(role)} /> : null}
    </div>
  );
}
