import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { isStaffRole, normalizeUserRole } from '../../../core/utils/userRole';
import type { UserGrowthPoint, UserListItem, UserReportFilters } from '../../../types/user';

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

function toDateOrNull(value: string | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function filterUsersForReport(users: UserListItem[], filters: UserReportFilters): UserListItem[] {
  const term = filters.search.trim().toLowerCase();
  const fromDate = toDateOrNull(filters.fromDate);
  const toDate = toDateOrNull(filters.toDate);

  if (toDate) {
    toDate.setHours(23, 59, 59, 999);
  }

  return users.filter((user) => {
    const normalizedRole = normalizeUserRole(user.role);

    if (filters.roleScope === 'STUDENT' && normalizedRole !== 'STUDENT') {
      return false;
    }

    if (filters.roleScope === 'STAFF' && !isStaffRole(normalizedRole)) {
      return false;
    }

    if (filters.roleScope === 'ADMIN' && normalizedRole !== 'ADMIN') {
      return false;
    }

    if (filters.roleScope === 'TECHNICIAN' && normalizedRole !== 'TECHNICIAN') {
      return false;
    }

    if (term && !user.name.toLowerCase().includes(term) && !user.email.toLowerCase().includes(term)) {
      return false;
    }

    const createdDate = toDateOrNull(user.createdAt);

    if (fromDate && (!createdDate || createdDate < fromDate)) {
      return false;
    }

    if (toDate && (!createdDate || createdDate > toDate)) {
      return false;
    }

    return true;
  });
}

export function exportUsersCsv(users: UserListItem[], fileName: string) {
  const rows = users.map((user) => ({
    Name: user.name,
    Email: user.email,
    Role: normalizeUserRole(user.role),
    CreatedAt: user.createdAt ? new Date(user.createdAt).toISOString() : '',
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, fileName);
}

export function exportUsersPdf(users: UserListItem[], fileName: string, filters: UserReportFilters) {
  const doc = new jsPDF();
  const generatedAt = new Date().toLocaleString();

  doc.setFontSize(16);
  doc.text('User Report', 14, 16);

  doc.setFontSize(10);
  doc.text(`Generated: ${generatedAt}`, 14, 22);
  doc.text(`Role scope: ${filters.roleScope}`, 14, 27);
  doc.text(`Search: ${filters.search || '-'}`, 14, 32);
  doc.text(`From: ${filters.fromDate || '-'}  To: ${filters.toDate || '-'}`, 14, 37);

  autoTable(doc, {
    startY: 42,
    head: [['Name', 'Email', 'Role', 'Created At']],
    body: users.map((user) => [
      user.name,
      user.email,
      normalizeUserRole(user.role),
      user.createdAt ? new Date(user.createdAt).toLocaleString() : '-',
    ]),
    styles: {
      fontSize: 9,
    },
    headStyles: {
      fillColor: [14, 42, 100],
    },
  });

  doc.save(fileName);
}

export function buildYearlyGrowthData(users: UserListItem[], year: number): UserGrowthPoint[] {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const points: UserGrowthPoint[] = months.map((month) => ({ month, student: 0, technician: 0 }));

  users.forEach((user) => {
    const createdDate = toDateOrNull(user.createdAt);
    if (!createdDate || createdDate.getFullYear() !== year) {
      return;
    }

    const role = normalizeUserRole(user.role);
    const monthIndex = createdDate.getMonth();

    if (role === 'STUDENT') {
      points[monthIndex].student += 1;
    }

    if (role === 'TECHNICIAN') {
      points[monthIndex].technician += 1;
    }
  });

  return points;
}
