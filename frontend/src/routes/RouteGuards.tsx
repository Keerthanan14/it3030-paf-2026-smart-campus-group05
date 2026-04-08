import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../core/store/authStore';
import { TOKEN_KEY } from '../core/store/authStore';
import { redirectPathByRole } from '../core/utils/redirectPathByRole.ts';

function normalizeRole(role: string | null | undefined) {
  return (role ?? '').replace('ROLE_', '').toUpperCase();
}

function decodeRoleFromToken(token: string | null): string | null {
  if (!token) {
    return null;
  }

  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    const json = atob(padded);
    const payload = JSON.parse(json) as { role?: string };
    return normalizeRole(payload.role ?? null);
  } catch {
    return null;
  }
}

interface RoleRouteProps {
  allowedRole: 'ADMIN' | 'STUDENT' | 'TECHNICIAN';
}

export function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}

function RoleRoute({ allowedRole }: RoleRouteProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  const tokenRole = decodeRoleFromToken(token);
  const userRole = normalizeRole(user?.role);
  const role = tokenRole || userRole;

  if (!role) {
    return <Navigate to="/auth/login" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to={redirectPathByRole((tokenRole || user?.role || '') as string)} replace />;
  }

  return <Outlet />;
}

export function AdminRoute() {
  return <RoleRoute allowedRole="ADMIN" />;
}

export function StudentRoute() {
  return <RoleRoute allowedRole="STUDENT" />;
}

export function TechnicianRoute() {
  return <RoleRoute allowedRole="TECHNICIAN" />;
}
