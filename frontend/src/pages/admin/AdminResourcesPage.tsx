import { ResourceFilters } from '../../features/resources/components/ResourceFilters';
import { ResourceTable } from '../../features/resources/components/ResourceTable';
import { useAdminResources } from '../../features/resources/hooks/useAdminResources';

export default function AdminResourcesPage() {
  const {
    resources,
    filters,
    loading,
    error,
    page,
    size,
    totalPages,
    totalElements,
    setPage,
    setPageSize,
    applyFilters,
    updateStatus,
    removeResource,
  } = useAdminResources();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Resource Management</h1>
        <p className="mt-1 text-sm text-foreground/70">Manage campus resources, availability, and scheduling rules.</p>
        <hr className="mt-4 -mx-4 border-border/70 sm:-mx-6 lg:-mx-8" />
      </div>

      <ResourceFilters initialFilters={filters} onApply={applyFilters} />

      {error ? <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <ResourceTable
        items={resources}
        loading={loading}
        onToggleStatus={(id, nextStatus) => {
          void updateStatus(id, nextStatus);
        }}
        onDelete={(id) => {
          void removeResource(id);
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/60 bg-card p-4">
        <p className="text-sm text-foreground/70">
          Showing page {page + 1} of {Math.max(totalPages, 1)} ({totalElements} total resources)
        </p>
        <div className="flex items-center gap-2">
          <select
            className="h-9 rounded-md border border-border/70 bg-background px-2 text-sm"
            value={size}
            onChange={(e) => setPageSize(Number(e.target.value))}
          >
            <option value={5}>5 / page</option>
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
          </select>
          <button
            type="button"
            className="rounded-md border border-border/70 px-3 py-1.5 text-sm disabled:opacity-40"
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page <= 0 || loading}
          >
            Previous
          </button>
          <button
            type="button"
            className="rounded-md border border-border/70 px-3 py-1.5 text-sm disabled:opacity-40"
            onClick={() => setPage(page + 1)}
            disabled={loading || totalPages === 0 || page >= totalPages - 1}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
