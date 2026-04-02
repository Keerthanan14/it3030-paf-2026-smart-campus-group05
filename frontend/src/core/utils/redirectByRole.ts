import type { UserRole } from '../../types/auth';

export function redirectByRole(role: UserRole, navigate: (path: string) => void) {
  const normalizedRole = role.replace('ROLE_', '').toUpperCase();

  if (normalizedRole === 'ADMIN') {
    navigate('/admin/dashboard');
    return;
  }

  if (normalizedRole === 'TECHNICIAN') {
    navigate('/technician/dashboard');
    return;
  }

  navigate('/student/dashboard');
}
