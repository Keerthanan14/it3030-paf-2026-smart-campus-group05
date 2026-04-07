import { Card } from '../../../shared/components/ui/Card';
import AdminCreateStaffModal from './AdminCreateStaffModal';
import AdminUsersGrowthChart from './AdminUsersGrowthChart';
import AdminUsersReportModal from './AdminUsersReportModal';
import AdminUsersSummaryCards from './AdminUsersSummaryCards';
import AdminUsersTable from './AdminUsersTable';
import AdminUsersTabs from './AdminUsersTabs';
import AdminUsersToolbar from './AdminUsersToolbar';
import useAdminUsersManagement from '../hooks/useAdminUsersManagement';

export function AdminUsersManagementPanel() {
  const {
    users,
    filteredCount,
    counts,
    loading,
    error,
    search,
    setSearch,
    tab,
    setTab,
    staffRoleFilter,
    setStaffRoleFilter,
    isCreateModalOpen,
    openCreateModal,
    closeCreateModal,
    isReportModalOpen,
    openReportModal,
    closeReportModal,
    createLoading,
    createStaff,
    reportFilters,
    setReportFilters,
    reportUsers,
    generateCsvReport,
    generatePdfReport,
    selectedYear,
    setSelectedYear,
    growthData,
    availableYears,
    refresh,
    pagination,
  } = useAdminUsersManagement();

  return (
    <div className="space-y-4">
      <AdminUsersSummaryCards counts={counts} />

      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <AdminUsersTabs value={tab} onChange={setTab} />
        </div>

        <AdminUsersToolbar
          search={search}
          onSearchChange={setSearch}
          tab={tab}
          staffRoleFilter={staffRoleFilter}
          onStaffRoleFilterChange={setStaffRoleFilter}
          onOpenCreateModal={openCreateModal}
          onOpenReportModal={openReportModal}
          onRefresh={() => void refresh()}
          loading={loading}
          pagination={pagination}
          filteredCount={filteredCount}
        />

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <AdminUsersTable users={users} loading={loading} />
      </Card>

      <AdminUsersGrowthChart
        data={growthData}
        selectedYear={selectedYear}
        availableYears={availableYears}
        onYearChange={setSelectedYear}
      />

      <AdminCreateStaffModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        isLoading={createLoading}
        onSubmit={createStaff}
      />

      <AdminUsersReportModal
        isOpen={isReportModalOpen}
        filters={reportFilters}
        previewCount={reportUsers.length}
        onClose={closeReportModal}
        onFiltersChange={setReportFilters}
        onGenerateCsv={generateCsvReport}
        onGeneratePdf={generatePdfReport}
      />
    </div>
  );
}

export default AdminUsersManagementPanel;
