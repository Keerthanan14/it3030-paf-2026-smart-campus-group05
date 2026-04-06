import type { ResourceItem } from '../../../types/resource';
import { Link } from 'react-router-dom';

interface ResourceTableProps {
  items: ResourceItem[];
  loading: boolean;
  canManage?: boolean;
  onToggleStatus?: (id: string, nextStatus: 'ACTIVE' | 'OUT_OF_SERVICE') => void;
  onDelete?: (id: string) => void;
}

export function ResourceTable({ items, loading, canManage = true, onToggleStatus, onDelete }: ResourceTableProps) {
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
            <th className="px-4 py-3 font-semibold">Capacity</th>
            <th className="px-4 py-3 font-semibold">Location</th>
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
                <td className="px-4 py-3">{item.capacity}</td>
                <td className="px-4 py-3">{item.location}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                      item.status === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      to={`/resources/${item.id}`}
                      className="rounded-md border border-border/70 px-3 py-1.5 text-xs"
                    >
                      View
                    </Link>
                    {canManage ? (
                      <>
                        <Link
                          to={`/admin/resources/${item.id}/edit`}
                          className="rounded-md border border-border/70 px-3 py-1.5 text-xs"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          className="rounded-md border border-border/70 px-3 py-1.5 text-xs"
                          onClick={() => onToggleStatus?.(item.id, nextStatus)}
                        >
                          Mark {nextStatus}
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-rose-300 px-3 py-1.5 text-xs text-rose-700"
                          onClick={() => onDelete?.(item.id)}
                        >
                          Delete
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