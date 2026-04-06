import { Link } from 'react-router-dom';
import type { ResourceItem } from '../../../types/resource';

interface ResourceDetailCardProps {
  resource: ResourceItem;
  canManage: boolean;
}

export function ResourceDetailCard({ resource, canManage }: ResourceDetailCardProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">{resource.name}</h2>
          <p className="mt-1 text-sm text-foreground/70">{resource.description || 'No description provided.'}</p>
        </div>
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
            resource.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
          }`}
        >
          {resource.status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-md border border-border/60 p-3">
          <p className="text-xs uppercase text-foreground/60">Type</p>
          <p className="mt-1 text-sm font-medium">{resource.type}</p>
        </div>
        <div className="rounded-md border border-border/60 p-3">
          <p className="text-xs uppercase text-foreground/60">Capacity</p>
          <p className="mt-1 text-sm font-medium">{resource.capacity}</p>
        </div>
        <div className="rounded-md border border-border/60 p-3">
          <p className="text-xs uppercase text-foreground/60">Location</p>
          <p className="mt-1 text-sm font-medium">{resource.location}</p>
        </div>
        <div className="rounded-md border border-border/60 p-3">
          <p className="text-xs uppercase text-foreground/60">Updated</p>
          <p className="mt-1 text-sm font-medium">{new Date(resource.updatedAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/resources/${resource.id}/calendar`} className="rounded-md border border-border/70 px-3 py-2 text-sm">
          View Calendar
        </Link>
        {canManage ? (
          <Link to={`/admin/resources/${resource.id}/edit`} className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground">
            Edit Resource
          </Link>
        ) : null}
      </div>
    </div>
  );
}
