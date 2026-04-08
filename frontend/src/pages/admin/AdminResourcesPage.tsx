import { useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ResourceFilters } from '../../features/resources/components/ResourceFilters';
import { ResourceDetailCard } from '../../features/resources/components/ResourceDetailCard';
import { ResourceForm } from '../../features/resources/components/ResourceForm';
import { ResourceTable } from '../../features/resources/components/ResourceTable';
import { ResourcePagination } from '../../features/resources/components/ResourcePagination';
import { ResourcePageShell } from '../../features/resources/components/ResourcePageShell';
import { ResourceAvailabilityCalendar } from '../../features/resources/components/ResourceAvailabilityCalendar';
import { StickyPageHeader } from '../../shared/components/ui/StickyPageHeader';
import { useAdminResources } from '../../features/resources/hooks/useAdminResources';
import { useResourceForm } from '../../features/resources/hooks/useResourceForm';
import { useResourceDetailModal } from '../../features/resources/hooks/useResourceDetailModal';
import { useResourceDetail } from '../../features/resources/hooks/useResourceDetail';
import { useResourceAvailability } from '../../features/resources/hooks/useResourceAvailability';
import { resourceApi } from '../../core/api/resourceApi';
import { useToast } from '../../shared/components/ui/useToast';
import type { ResourceItem } from '../../types/resource';
import { Modal } from '../../shared/components/ui/Modal';

type ResourceReportColumnKey =
  | 'building'
  | 'type'
  | 'location'
  | 'floor'
  | 'name'
  | 'capacity'
  | 'chairCount'
  | 'tableCount'
  | 'hasAc'
  | 'hasFan'
  | 'hasProjector'
  | 'hasSmartboard'
  | 'hasCamera'
  | 'hasPodiumWithPc'
  | 'hasPodium'
  | 'hasWhiteboard'
  | 'hasClock'
  | 'hasLectureChairs'
  | 'hasLectureDesks'
  | 'hasSpeakers'
  | 'hasWifi'
  | 'hasPowerOutlets'
  | 'description'
  | 'status'
  | 'allowBookings'
  | 'allowRequests';

interface ResourceReportColumn {
  key: ResourceReportColumnKey;
  label: string;
}

const reportColumns: ResourceReportColumn[] = [
  { key: 'building', label: 'Building' },
  { key: 'type', label: 'Type' },
  { key: 'location', label: 'Location' },
  { key: 'floor', label: 'Floor' },
  { key: 'name', label: 'Name' },
  { key: 'capacity', label: 'Capacity' },
  { key: 'chairCount', label: 'Chair' },
  { key: 'tableCount', label: 'Table' },
  { key: 'hasAc', label: 'AC' },
  { key: 'hasFan', label: 'Fan' },
  { key: 'hasProjector', label: 'Projector' },
  { key: 'hasSmartboard', label: 'Smartboard' },
  { key: 'hasCamera', label: 'Camera' },
  { key: 'hasPodiumWithPc', label: 'Podium with PC' },
  { key: 'hasPodium', label: 'Podium' },
  { key: 'hasWhiteboard', label: 'Whiteboard' },
  { key: 'hasClock', label: 'Clock' },
  { key: 'hasLectureChairs', label: 'Lecture chairs' },
  { key: 'hasLectureDesks', label: 'Lecture desks' },
  { key: 'hasSpeakers', label: 'Speakers' },
  { key: 'hasWifi', label: 'Wi-Fi' },
  { key: 'hasPowerOutlets', label: 'Power outlets / charging ports' },
  { key: 'description', label: 'Description' },
  { key: 'status', label: 'Status' },
  { key: 'allowBookings', label: 'Allow Bookings' },
  { key: 'allowRequests', label: 'Allow Requests' },
];

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function toZeroOne(value: boolean | undefined) {
  return value ? '1' : '0';
}

function columnValue(resource: ResourceItem, key: ResourceReportColumnKey): string {
  switch (key) {
    case 'building':
      return resource.building ?? '';
    case 'type':
      return resource.type;
    case 'location':
      return resource.location;
    case 'floor':
      return resource.floor !== undefined && resource.floor !== null ? String(resource.floor) : '';
    case 'name':
      return resource.name;
    case 'capacity':
      return String(resource.capacity ?? '');
    case 'chairCount':
      return String(resource.chairCount ?? '');
    case 'tableCount':
      return String(resource.tableCount ?? '');
    case 'hasAc':
      return toZeroOne(resource.hasAc);
    case 'hasFan':
      return toZeroOne(resource.hasFan);
    case 'hasProjector':
      return toZeroOne(resource.hasProjector);
    case 'hasSmartboard':
      return toZeroOne(resource.hasSmartboard);
    case 'hasCamera':
      return toZeroOne(resource.hasCamera);
    case 'hasPodiumWithPc':
      return toZeroOne(resource.hasPodiumWithPc);
    case 'hasPodium':
      return toZeroOne(resource.hasPodium);
    case 'hasWhiteboard':
      return toZeroOne(resource.hasWhiteboard);
    case 'hasClock':
      return toZeroOne(resource.hasClock);
    case 'hasLectureChairs':
      return toZeroOne(resource.hasLectureChairs);
    case 'hasLectureDesks':
      return toZeroOne(resource.hasLectureDesks);
    case 'hasSpeakers':
      return toZeroOne(resource.hasSpeakers);
    case 'hasWifi':
      return toZeroOne(resource.hasWifi);
    case 'hasPowerOutlets':
      return toZeroOne(resource.hasPowerOutlets);
    case 'description':
      return resource.description ?? '';
    case 'status':
      return resource.status === 'ACTIVE' ? '1' : '0';
    case 'allowBookings':
      return toZeroOne(resource.allowBookings);
    case 'allowRequests':
      return toZeroOne(resource.allowRequests);
    default:
      return '';
  }
}

function exportResourcesCsv(resources: ResourceItem[], fileName: string, selectedColumns: ResourceReportColumnKey[]) {
  const selectedConfig = reportColumns.filter((column) => selectedColumns.includes(column.key));
  const rows = resources.map((resource) => {
    const row: Record<string, string> = {};
    selectedConfig.forEach((column) => {
      row[column.label] = columnValue(resource, column.key);
    });
    return row;
  });

  const csv = Papa.unparse(rows);
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), fileName);
}

function exportResourcesPdf(resources: ResourceItem[], fileName: string, selectedColumns: ResourceReportColumnKey[]) {
  const doc = new jsPDF({ orientation: 'l' });
  const generatedAt = new Date().toLocaleString();
  const selectedConfig = reportColumns.filter((column) => selectedColumns.includes(column.key));

  doc.setFontSize(16);
  doc.text('Resource Report', 14, 16);

  doc.setFontSize(9);
  doc.text(`Generated: ${generatedAt}`, 14, 22);

  autoTable(doc, {
    startY: 30,
    head: [selectedConfig.map((column) => column.label)],
    body: resources.map((resource) => selectedConfig.map((column) => columnValue(resource, column.key))),
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
    },
    columnStyles: (() => {
      const styles: Record<number, { cellWidth: 'auto' }> = {};
      for (let i = 0; i < selectedConfig.length; i++) {
        styles[i] = { cellWidth: 'auto' };
      }
      return styles;
    })(),
    headStyles: {
      fillColor: [14, 42, 100],
      fontSize: 5,
      textColor: [255, 255, 255],
      cellPadding: 0,
      minCellHeight: 28,
      lineWidth: 0.5,
      lineColor: [100, 100, 100],
    },
    bodyStyles: {
      textColor: [0, 0, 0],
      lineWidth: 0.4,
      lineColor: [200, 200, 200],
    },
    didParseCell: function (data) {
      if (data.section === 'head') {
        // Prevent autoTable from drawing unrotated header text.
        data.cell.text = [''];
      }
    },
    didDrawCell: function (data) {
      if (data.section === 'head') {
        const docAny = doc as any;
        const cell = data.cell;
        const headerText = selectedConfig[data.column.index]?.label ?? '';
        
        const x = cell.x + cell.width / 2;
        const y = cell.y + cell.height / 2;

        docAny.saveGraphicsState();
        docAny.setTextColor(255, 255, 255);
        docAny.setFontSize(4);
        
        // Rotate 90 so header text is vertical toward the right/up side
        docAny.text(headerText, x, y, {
          align: 'center',
          baseline: 'middle',
          angle: 90,
        });
        
        docAny.restoreGraphicsState();
      }
    },
    margin: { top: 30, right: 5, bottom: 5, left: 5 },
  });

  doc.save(fileName);
}

async function fetchResourcesForReport() {
  const firstPage = await resourceApi.listResources({ page: 0, size: 1, filters: {} });
  const totalElements = firstPage.data.totalElements ?? 0;

  if (totalElements === 0) {
    return [] as ResourceItem[];
  }

  const response = await resourceApi.listResources({ page: 0, size: totalElements, filters: {} });
  return response.data.content ?? [];
}

export default function AdminResourcesPage() {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  const isFormRoute = location.pathname === '/admin/resources/new' || location.pathname.endsWith('/edit');
  const isDetailView = location.pathname.includes('/view') && !location.pathname.includes('/calendar');
  const isCalendarView = location.pathname.includes('/calendar');

  // Detail and Calendar view hooks
  const { resource: detailResource, loading: detailLoading, error: detailError } = useResourceDetail(isDetailView ? id : undefined);
  const { from, to, setRange, data: calendarData, loading: calendarLoading, error: calendarError } = useResourceAvailability(isCalendarView ? id : undefined);

  // Modal for list view
  const { isOpen, loading: viewLoading, error: viewError, resource: selectedResource, open: openViewModal, close: closeViewModal } = useResourceDetailModal();
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<ResourceReportColumnKey[]>(reportColumns.map((column) => column.key));

  const [reportLoading, setReportLoading] = useState<null | 'csv' | 'pdf'>(null);

  // Form view
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

  // List view
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
  } = useAdminResources({ enabled: !isFormRoute && !isDetailView && !isCalendarView });

  const handleFormSubmit = async () => {
    const success = await save();
    if (success) {
      navigate('/admin/resources');
    }
  };

  const handleBookSlot = (payload: { resourceId: string; date: string; startTime: string; endTime: string }) => {
    const params = new URLSearchParams({
      resourceId: payload.resourceId,
      date: payload.date,
      startTime: payload.startTime,
      endTime: payload.endTime,
    });
    navigate(`/student/booking?${params.toString()}`);
  };

  const openReportModal = () => {
    setSelectedColumns(reportColumns.map((column) => column.key));
    setReportModalOpen(true);
  };

  const closeReportModal = () => {
    if (reportLoading) {
      return;
    }

    setReportModalOpen(false);
  };

  const handleReportExport = async (format: 'csv' | 'pdf') => {
    if (selectedColumns.length === 0) {
      toast.warning('No columns selected', 'Select at least one report column before exporting.');
      return;
    }

    setReportLoading(format);

    try {
      const resources = await fetchResourcesForReport();

      if (resources.length === 0) {
        toast.warning('No data', 'No resources match the selected report filters.');
        return;
      }

      const stamp = new Date().toISOString().slice(0, 10);
      const fileName = `resources-report-${stamp}.${format === 'csv' ? 'csv' : 'pdf'}`;

      if (format === 'csv') {
        exportResourcesCsv(resources, fileName, selectedColumns);
      } else {
        exportResourcesPdf(resources, fileName, selectedColumns);
      }

      try {
        await resourceApi.logReportGeneration({
          format,
          selectedColumnCount: selectedColumns.length,
        });
      } catch {
        // Export should still succeed even if audit logging fails.
      }

      toast.success(`${format.toUpperCase()} generated`, 'Resource report download started.');
      setReportModalOpen(false);
    } catch (reportError) {
      const message = reportError instanceof Error ? reportError.message : 'Failed to generate resource report.';
      toast.error('Report failed', message);
    } finally {
      setReportLoading(null);
    }
  };

  // Render Detail View (full page)
  if (isDetailView) {
    return (
      <div className="space-y-6">
        <StickyPageHeader
          title="Resource Detail"
          description="View complete resource information and availability actions."
          action={
            <Link to="/admin/resources" className="rounded-md border border-border/70 px-3 py-2 text-sm">
              Back to Resources
            </Link>
          }
        />

        {detailLoading ? <div className="rounded-lg border border-border/60 bg-card p-4 text-sm">Loading resource...</div> : null}
        {detailError ? <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-sm text-rose-700">{detailError}</div> : null}

        {detailResource ? <ResourceDetailCard resource={detailResource} canManage /> : null}
      </div>
    );
  }

  // Render Calendar View (full page)
  if (isCalendarView) {
    return (
      <div className="space-y-6">
        <StickyPageHeader
          title="Resource Calendar"
          description="Check date-range availability and blocked booking slots."
          action={
            <Link to={id ? `/admin/resources/${id}/view` : '/admin/resources'} className="rounded-md border border-border/70 px-3 py-2 text-sm">
              Back
            </Link>
          }
        />

        <ResourceAvailabilityCalendar
          resourceId={id}
          data={calendarData}
          loading={calendarLoading}
          error={calendarError}
          from={from}
          to={to}
          onRangeChange={setRange}
          onBookSlot={handleBookSlot}
        />
      </div>
    );
  }

  // Render Form View
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

  // Render List View (default)
  // Render List View (default)
  return (
    <ResourcePageShell
      title="Resource Management"
      description="Manage campus resources, availability, and scheduling rules."
      action={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openReportModal}
            className="rounded-md border border-border/70 bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground hover:opacity-90"
          >
            Report
          </button>
          <Link
            to="/admin/resources/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Add Resource
          </Link>
        </div>
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

      <Modal isOpen={isReportModalOpen} onClose={closeReportModal} title="Resource Report" className="max-w-5xl p-4 sm:p-6">
        <div className="space-y-4">
          <p className="text-sm text-foreground/70">Choose columns and export the report as CSV or PDF.</p>

          <div className="rounded-md border border-border/70 bg-card p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Check columns to include in report</span>
              <button
                type="button"
                className="text-xs text-primary underline"
                onClick={() => setSelectedColumns(reportColumns.map((column) => column.key))}
              >
                Select all
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {reportColumns.map((column) => {
                const checked = selectedColumns.includes(column.key);
                return (
                  <label key={column.key} className="inline-flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const nextChecked = e.target.checked;
                        setSelectedColumns((current) => {
                          if (nextChecked) {
                            return current.includes(column.key) ? current : [...current, column.key];
                          }
                          return current.filter((key) => key !== column.key);
                        });
                      }}
                    />
                    <span>{column.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={closeReportModal}
              className="rounded-md border border-border/70 px-4 py-2 text-sm"
              disabled={Boolean(reportLoading)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleReportExport('csv')}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground disabled:opacity-60"
              disabled={Boolean(reportLoading)}
            >
              {reportLoading === 'csv' ? 'Generating CSV...' : 'Export CSV'}
            </button>
            <button
              type="button"
              onClick={() => void handleReportExport('pdf')}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              disabled={Boolean(reportLoading)}
            >
              {reportLoading === 'pdf' ? 'Generating PDF...' : 'Export PDF'}
            </button>
          </div>
        </div>
      </Modal>
    </ResourcePageShell>
  );
}
