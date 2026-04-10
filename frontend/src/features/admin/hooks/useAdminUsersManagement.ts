import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDebounce } from '../../../core/hooks/useDebounce';
import { usePagination } from '../../../core/hooks/usePagination';
import { userApi } from '../../../core/api/userApi';
import { isStaffRole, normalizeUserRole } from '../../../core/utils/userRole';
import { useToast } from '../../../shared/components/ui/useToast';
import type { CreateStaffRequest, StaffRoleFilter, UserListItem, UserReportFilters, UserTabFilter } from '../../../types/user';
import {
  buildYearlyGrowthData,
  exportUsersCsv,
  exportUsersPdf,
  filterUsersForReport,
} from '../services/userReportService';

export function useAdminUsersManagement() {
  const toast = useToast();

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  
  const [tab, setTab] = useState<UserTabFilter>('ALL');
  const [staffRoleFilter, setStaffRoleFilter] = useState<StaffRoleFilter>('ALL');
  
  const pagination = usePagination({
    initialPage: 0,
    initialPageSize: 5,
    totalItems: 0,
  });

  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [isReportModalOpen, setReportModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [reportFilters, setReportFilters] = useState<UserReportFilters>({
    roleScope: 'ALL',
    search: '',
    fromDate: '',
    toDate: '',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await userApi.getAll();
      setUsers(data);
    } catch (fetchError) {
      const message = fetchError instanceof Error ? fetchError.message : 'Failed to load users.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();

    return users.filter((user) => {
      const normalizedRole = normalizeUserRole(user.role);

      if (tab === 'STUDENT' && normalizedRole !== 'STUDENT') {
        return false;
      }

      if (tab === 'STAFF' && !isStaffRole(normalizedRole)) {
        return false;
      }

      if (tab === 'STAFF' && staffRoleFilter !== 'ALL' && normalizedRole !== staffRoleFilter) {
        return false;
      }

      if (!term) {
        return true;
      }

      return user.name.toLowerCase().includes(term) || user.email.toLowerCase().includes(term);
    });
  }, [users, debouncedSearch, tab, staffRoleFilter]);

  // Update pagination total when filtered users change
  useEffect(() => {
    pagination.setTotalItems(filteredUsers.length);
    pagination.setPage(0); // Reset to first page on filter change
  }, [filteredUsers.length, pagination]);

  const counts = useMemo(() => {
    return users.reduce(
      (acc, user) => {
        const role = normalizeUserRole(user.role);
        acc.all += 1;
        if (role === 'STUDENT') acc.student += 1;
        if (role === 'ADMIN') acc.admin += 1;
        if (role === 'TECHNICIAN') acc.technician += 1;
        return acc;
      },
      { all: 0, student: 0, admin: 0, technician: 0 }
    );
  }, [users]);

  const openCreateModal = () => setCreateModalOpen(true);
  const closeCreateModal = () => setCreateModalOpen(false);
  const openReportModal = () => setReportModalOpen(true);
  const closeReportModal = () => setReportModalOpen(false);

  const reportUsers = useMemo(() => filterUsersForReport(users, reportFilters), [users, reportFilters]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    const currentYear = new Date().getFullYear();

    users.forEach((user) => {
      if (!user.createdAt) {
        return;
      }

      const parsed = new Date(user.createdAt);
      if (!Number.isNaN(parsed.getTime())) {
        years.add(parsed.getFullYear());
      }
    });

    years.add(currentYear);

    return Array.from(years).sort((a, b) => b - a);
  }, [users]);

  const growthData = useMemo(() => {
    return buildYearlyGrowthData(users, selectedYear);
  }, [users, selectedYear]);

  const generateCsvReport = () => {
    if (reportUsers.length === 0) {
      toast.warning('No data', 'No users match current report filters.');
      return;
    }

    exportUsersCsv(reportUsers, `users-report-${new Date().toISOString().slice(0, 10)}.csv`);
    toast.success('CSV generated', 'User report download started.');
  };

  const generatePdfReport = () => {
    if (reportUsers.length === 0) {
      toast.warning('No data', 'No users match current report filters.');
      return;
    }

    exportUsersPdf(reportUsers, `users-report-${new Date().toISOString().slice(0, 10)}.pdf`, reportFilters);
    toast.success('PDF generated', 'User report download started.');
  };

  const createStaff = async (payload: CreateStaffRequest) => {
    setCreateLoading(true);

    try {
      const { data } = await userApi.createStaff(payload);
      toast.success('Staff created', `${data.email} added as ${data.role}. Temporary password sent by email.`);
      closeCreateModal();
      await fetchUsers();
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Failed to create staff account.';
      toast.error('Create failed', message);
    } finally {
      setCreateLoading(false);
    }
  };

  // Get paginated users for current page
  const paginatedUsers = useMemo(() => {
    return filteredUsers.slice(pagination.offset, pagination.offset + pagination.pageSize);
  }, [filteredUsers, pagination.offset, pagination.pageSize]);

  return {
    users: paginatedUsers,
    allUsers: users,
    filteredCount: filteredUsers.length,
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
    refresh: fetchUsers,
    pagination,
  };
}

export default useAdminUsersManagement;
