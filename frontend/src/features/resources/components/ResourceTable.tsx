import type { ResourceItem } from '../../../types/resource';
import { Link, useLocation } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { useAuthStore } from '../../../core/store/authStore';

interface ResourceTableProps {
  items: ResourceItem[];
  loading: boolean;
  canManage?: boolean;
  onToggleStatus?: (id: string, nextStatus: 'ACTIVE' | 'OUT_OF_SERVICE') => void;
  onDelete?: (id: string) => void;
  onView?: (id: string) => void;
}

export function ResourceTable({ items, loading, canManage = true, onToggleStatus, onDelete: _onDelete, onView }: ResourceTableProps) {
  const userRole = useAuthStore((state) => state.user?.role);
  const location = useLocation();

  const getViewPath = (id: string) => {
    if (canManage || location.pathname.startsWith('/admin')) {
      return `/admin/resources/${id}/view`;
    }

    if (location.pathname.startsWith('/technician')) {
      return `/technician/resources/${id}`;
    }

    if (location.pathname.startsWith('/student')) {
      return `/student/resources/${id}`;
    }

    const role = (userRole ?? '').replace('ROLE_', '').toUpperCase();

    if (role === 'ADMIN') {
      return `/admin/resources/${id}/view`;
    }

    if (role === 'TECHNICIAN') {
      return `/technician/resources/${id}`;
    }

    return `/student/resources/${id}`;
  };

  const formatStatusLabel = (status: 'ACTIVE' | 'OUT_OF_SERVICE') =>
    status === 'OUT_OF_SERVICE' ? 'Out of Service' : 'Active';

  const formatFloorLabel = (floor: number) => {
    const mod10 = floor % 10;
    const mod100 = floor % 100;
    const suffix = mod10 === 1 && mod100 !== 11 ? 'st' : mod10 === 2 && mod100 !== 12 ? 'nd' : mod10 === 3 && mod100 !== 13 ? 'rd' : 'th';
    return `${floor} ${suffix} Floor`;
  };

  const formatLocationLabel = (item: ResourceItem) => {
    if (item.building && item.floor !== undefined && item.floor !== null) {
      const buildingLabel = item.building === 'MAIN' ? 'Main Building' : 'Sub Building';
      return `${buildingLabel} ${formatFloorLabel(item.floor)}`;
    }

    if (item.building) {
      return item.building === 'MAIN' ? 'Main Building' : 'Sub Building';
    }

    const locationMatch = item.location.match(/^(MAIN|SUB)\s*-\s*Floor\s*(\d+)$/i);
    if (locationMatch) {
      const buildingLabel = locationMatch[1].toUpperCase() === 'MAIN' ? 'Main Building' : 'Sub Building';
      return `${buildingLabel} ${formatFloorLabel(Number(locationMatch[2]))}`;
    }

    return item.location;
  };

  if (loading) {
    return <div className="rounded-lg border border-border/60 bg-card p-4 text-sm">Loading resources...</div>;
  }

  if (items.length === 0) {
    return <div className="rounded-lg border border-border/60 bg-card p-4 text-sm">No resources found.</div>;
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
      <table className="min-w-full text-sm">
        <thead className="border-b border-border/70 bg-muted/20 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Type</th>
            <th className="px-4 py-3 font-semibold">Location</th>
            <th className="px-4 py-3 font-semibold">Booking</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const nextStatus = item.status === 'ACTIVE' ? 'OUT_OF_SERVICE' : 'ACTIVE';
            return (
              <tr key={item.id} className="border-b border-border/50">
                <td className="px-4 py-3">{item.name}</td>
                <td className="px-4 py-3">{item.type}</td>
                <td className="px-4 py-3">{formatLocationLabel(item)}</td>
                <td className="px-4 py-3">{item.allowBookings ? 'Yes' : 'No'}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      item.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {formatStatusLabel(item.status)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {onView ? (
                      <button
                        type="button"
                        className="rounded-md border border-border/70 px-3 py-1.5 text-xs"
                        onClick={() => onView(item.id)}
                      >
                        View
                      </button>
                    ) : (
                      <Link
                        to={getViewPath(item.id)}
                        className="rounded-md border border-border/70 px-3 py-1.5 text-xs"
                      >
                        View
                      </Link>
                    )}
                    {canManage ? (
                      <>
                        <Link
                          to={`/admin/resources/${item.id}/edit`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70"
                          aria-label="Edit resource"
                          title="Edit resource"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          className="rounded-md border border-border/70 px-3 py-1.5 text-xs"
                          onClick={() => onToggleStatus?.(item.id, nextStatus)}
                        >
                          {formatStatusLabel(nextStatus)}
                        </button>
                      </>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}