import api from './client';
import type { AuthUser, LoginResponse } from '../../types/auth';

export interface LoginRequest {
	email: string;
	password: string;
}

export interface RegisterCodeRequest {
	name: string;
	email: string;
}

export interface VerifyCodeRequest {
	email: string;
	code: string;
}

export interface SetPasswordRequest {
	email: string;
	code: string;
	password: string;
}

export interface ForgotPasswordRequest {
	email: string;
}

export interface ResetPasswordRequest {
	token: string;
	password: string;
}

export const authApi = {
	login(payload: LoginRequest) {
		return api.post<LoginResponse>('/auth/login', payload);
	},

	me(token?: string) {
		if (!token) {
			return api.get<AuthUser>('/auth/me');
		}
		return api.get<AuthUser>('/auth/me', {
			headers: { Authorization: `Bearer ${token}` },
		});
	},

	requestRegisterCode(payload: RegisterCodeRequest) {
		return api.post('/auth/register/request-code', payload);
	},

	verifyRegisterCode(payload: VerifyCodeRequest) {
		return api.post('/auth/register/verify-code', payload);
	},

	setRegisterPassword(payload: SetPasswordRequest) {
		return api.post('/auth/register/set-password', payload);
	},

	forgotPassword(payload: ForgotPasswordRequest) {
		return api.post('/auth/forgot-password', payload);
	},

	resetPassword(payload: ResetPasswordRequest) {
		return api.post('/auth/reset-password', payload);
	},
};
