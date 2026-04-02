import type { UserRole } from '../../types/auth';
import { redirectPathByRole } from './redirectPathByRole';

export function redirectByRole(role: UserRole, navigate: (path: string) => void) {
  navigate(redirectPathByRole(role));
}
