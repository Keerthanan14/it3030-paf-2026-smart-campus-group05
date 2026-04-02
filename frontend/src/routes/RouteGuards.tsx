import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../core/store/authStore';
import { redirectPathByRole } from '../core/utils/redirectPathByRole.ts';

function normalizeRole(role: string | null | undefined) {
  return (role ?? '').replace('ROLE_', '').toUpperCase();
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

  if (!user) {
    return <Outlet />;
  }

  const role = normalizeRole(user.role);
  if (role !== allowedRole) {
    return <Navigate to={redirectPathByRole(user.role)} replace />;
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
