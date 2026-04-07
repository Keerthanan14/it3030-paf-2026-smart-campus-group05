import api from './client';
import type { CreateStaffRequest, CreateStaffResponse, UserListItem } from '../../types/user';

export const userApi = {
  getAll() {
    return api.get<UserListItem[]>('/users');
  },

  createStaff(payload: CreateStaffRequest) {
    return api.post<CreateStaffResponse>('/admin/users/staff', payload);
  },
};
