import type { UserRole } from '../../types/auth';
import type { NotificationItem, NotificationReferenceType } from '../../types/notification';

function normalizeRole(role: UserRole | string | null | undefined): string {
  return (role ?? '').replace('ROLE_', '').toUpperCase();
}

function resolveBookingPath(role: string): string {
  return role === 'ADMIN' ? '/admin/bookings' : '/student/booking';
}

function resolveTicketPath(role: string): string {
  if (role === 'ADMIN') {
    return '/admin/tickets';
  }

  if (role === 'TECHNICIAN') {
    return '/technician/tickets';
  }

  return '/student/tickets';
}

export function resolveNotificationTarget(
  notification: Pick<NotificationItem, 'referenceType' | 'referenceId'>,
  role: UserRole | string | null | undefined
): string {
  const normalizedRole = normalizeRole(role);
  const referenceType = notification.referenceType as NotificationReferenceType | null;

  if (referenceType === 'BOOKING') {
    return resolveBookingPath(normalizedRole);
  }

  if (referenceType === 'TICKET') {
    return resolveTicketPath(normalizedRole);
  }

  if (normalizedRole === 'ADMIN') {
    return '/admin/dashboard';
  }

  if (normalizedRole === 'TECHNICIAN') {
    return '/technician/dashboard';
  }

  return '/student/dashboard';
}