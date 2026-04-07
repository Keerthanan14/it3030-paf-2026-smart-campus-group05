export type UserRoleValue = 'ADMIN' | 'TECHNICIAN' | 'STUDENT' | string;

export interface UserListItem {
  id: string;
  name: string;
  email: string;
  role: UserRoleValue;
  createdAt?: string;
}

export interface CreateStaffRequest {
  name: string;
  email: string;
  role: 'ADMIN' | 'TECHNICIAN';
}

export interface CreateStaffResponse {
  message: string;
  email: string;
  role: string;
}

export type UserTabFilter = 'ALL' | 'STUDENT' | 'STAFF';
export type StaffRoleFilter = 'ALL' | 'ADMIN' | 'TECHNICIAN';

export type UserReportRoleScope = 'ALL' | 'STUDENT' | 'STAFF' | 'ADMIN' | 'TECHNICIAN';

export interface UserReportFilters {
  roleScope: UserReportRoleScope;
  search: string;
  fromDate: string;
  toDate: string;
}

export interface UserGrowthPoint {
  month: string;
  student: number;
  technician: number;
}
