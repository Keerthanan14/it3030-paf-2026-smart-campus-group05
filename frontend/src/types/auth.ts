export type UserRole = 'ROLE_ADMIN' | 'ROLE_STUDENT' | 'ROLE_TECHNICIAN' | string;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  profilePicture?: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
}
