export function normalizeUserRole(role: string | undefined | null): string {
  return (role ?? '').replace('ROLE_', '').toUpperCase();
}

export function isStaffRole(role: string | undefined | null): boolean {
  const normalizedRole = normalizeUserRole(role);
  return normalizedRole === 'ADMIN' || normalizedRole === 'TECHNICIAN';
}
