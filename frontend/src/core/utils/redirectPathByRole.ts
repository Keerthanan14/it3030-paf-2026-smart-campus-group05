import type { UserRole } from '../../types/auth';

export function redirectPathByRole(role: UserRole) {
  const normalizedRole = role.replace('ROLE_', '').toUpperCase();

  if (normalizedRole === 'ADMIN') {
    return '/admin/dashboard';
  }

  if (normalizedRole === 'TECHNICIAN') {
    return '/technician/dashboard';
  }

  return '/student/dashboard';
}
