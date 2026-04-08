import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ResourceFilters } from '../../features/resources/components/ResourceFilters';
import { ResourceDetailCard } from '../../features/resources/components/ResourceDetailCard';
import { ResourceForm } from '../../features/resources/components/ResourceForm';
import { ResourceTable } from '../../features/resources/components/ResourceTable';
import { ResourcePagination } from '../../features/resources/components/ResourcePagination';
import { ResourcePageShell } from '../../features/resources/components/ResourcePageShell';
import { useAdminResources } from '../../features/resources/hooks/useAdminResources';
import { useResourceForm } from '../../features/resources/hooks/useResourceForm';
import { useResourceDetailModal } from '../../features/resources/hooks/useResourceDetailModal';
import { Modal } from '../../shared/components/ui/Modal';

export default function AdminResourcesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isFormRoute = location.pathname === '/admin/resources/new' || location.pathname.endsWith('/edit');

  const { isOpen, loading: viewLoading, error: viewError, resource: selectedResource, open: openViewModal, close: closeViewModal } = useResourceDetailModal();

  const {
    values,
    loading: formLoading,
    saving,
    error: formError,
    isEdit,
    days,
    setField,
    setWindowField,
    save,
  } = useResourceForm(isFormRoute ? id : undefined);

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
  } = useAdminResources({ enabled: !isFormRoute });

  const handleFormSubmit = async () => {
    const success = await save();
    if (success) {
      navigate('/admin/resources');
    }
  };

  if (isFormRoute) {
    return (
      <ResourcePageShell
        title={isEdit ? 'Edit Resource' : 'Create Resource'}
        description="Configure resource details and weekly availability windows."
        action={
          <Link
            to="/admin/resources"
            className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-medium text-secondary-foreground hover:opacity-90"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to Resources
          </Link>
        }
      >
        {formLoading ? (
          <div className="rounded-lg border border-border/60 bg-card p-4 text-sm">Loading resource...</div>
        ) : (
          <ResourceForm
            values={values}
            days={days}
            isEdit={isEdit}
            saving={saving}
            error={formError}
            onFieldChange={setField}
            onWindowChange={setWindowField}
            onSubmit={handleFormSubmit}
          />
        )}
      </ResourcePageShell>
    );
  }

  return (
    <ResourcePageShell
      title="Resource Management"
      description="Manage campus resources, availability, and scheduling rules."
      action={
        <Link
          to="/admin/resources/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Add Resource
        </Link>
      }
    >
      <ResourceFilters initialFilters={filters} onApply={applyFilters} />

      {error ? <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{error}</div> : null}

      <ResourceTable
        items={resources}
        loading={loading}
        onView={(id) => {
          void openViewModal(id);
        }}
        onToggleStatus={(id, nextStatus) => {
          void updateStatus(id, nextStatus);
        }}
        onDelete={(id) => {
          void removeResource(id);
        }}
      />

      <ResourcePagination
        page={page}
        size={size}
        totalPages={totalPages}
        totalElements={totalElements}
        loading={loading}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      <Modal isOpen={isOpen} onClose={closeViewModal} className="max-w-3xl p-4 sm:p-6">
        {viewLoading ? <div className="p-3 text-sm">Loading resource details...</div> : null}
        {viewError ? <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{viewError}</div> : null}
        {selectedResource ? <ResourceDetailCard resource={selectedResource} canManage /> : null}
      </Modal>
    </ResourcePageShell>
  );
}
