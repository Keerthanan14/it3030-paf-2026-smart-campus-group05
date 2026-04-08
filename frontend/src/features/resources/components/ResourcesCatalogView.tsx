import { ResourceFilters } from './ResourceFilters';
import { ResourcePagination } from './ResourcePagination';
import { ResourceTable } from './ResourceTable';
import { StickyPageHeader } from '../../../shared/components/ui/StickyPageHeader';
import { useAdminResources } from '../hooks/useAdminResources';

interface ResourcesCatalogViewProps {
  title?: string;
  description?: string;
}

export function ResourcesCatalogView({
  title = 'Resources',
  description = 'Explore available campus resources and open each profile for details.',
}: ResourcesCatalogViewProps) {
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
  } = useAdminResources();

  return (
    <div className="space-y-6">
      <StickyPageHeader title={title} description={description} />

      <ResourceFilters initialFilters={filters} onApply={applyFilters} />

      {error ? <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <ResourceTable items={resources} loading={loading} canManage={false} />

      <ResourcePagination
        page={page}
        size={size}
        totalPages={totalPages}
        totalElements={totalElements}
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}