import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { authApi } from '../../../core/api/authApi';
import { useAuthStore } from '../../../core/store/authStore';
import { redirectByRole } from '../../../core/utils/redirectByRole';
import { useToast } from '../../../shared/components/ui/useToast';
import type { ApiErrorResponse } from '../../../types/api';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      const response = await authApi.login(data);
      
      const token = response.data.accessToken;
      
      // After login, fetch user profile
      const userResponse = await authApi.me(token);

      setAuth(userResponse.data, token);
      toast.success('Login successful', 'Welcome back to SmartCampus.');

      // Define where to redirect based on role
      redirectByRole(userResponse.data.role, navigate);
      
    } catch (err: unknown) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        if (!err.response) {
          toast.error('Server unavailable', 'Backend server is not running or unreachable.');
          return;
        }

        if (err.response.status === 401) {
          toast.error('Login failed', 'Invalid email or password');
          return;
        }

        const message = err.response.data?.message || 'Unable to sign in right now. Please try again.';
        toast.warning('Login issue', message);
        return;
      }

      toast.error('Login failed', 'Unexpected error occurred. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = import.meta.env.VITE_OAUTH_START_URL || 'http://localhost:8080/oauth2/authorization/google';
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h2 className="text-3xl font-black tracking-tight text-foreground">Welcome back</h2>
        <p className="mt-2 text-base text-foreground/70">Sign in to your account to continue</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <Input
          id="email"
          type="email"
          label="Email"
          placeholder="Enter your email"
          autoComplete="email"
          className="h-12 rounded-xl border-border/80 bg-background/60"
          {...register('email')}
          error={errors.email?.message}
        />

        <Input
          id="password"
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="Enter your password"
          autoComplete="current-password"
          className="h-12 rounded-xl border-border/80 bg-background/60"
          {...register('password')}
          error={errors.password?.message}
          helperText="Password must be at least 8 characters"
          endAdornment={
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="rounded p-1 text-foreground/60 hover:text-foreground"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 102.83 2.83" />
                  <path d="M9.88 5.09A10.94 10.94 0 0112 5c5 0 9.27 3.11 11 7-1 2.25-2.66 4.16-4.73 5.33" />
                  <path d="M6.61 6.61C4.62 7.88 3 9.77 2 12c1.73 3.89 6 7 10 7 1.85 0 3.62-.44 5.2-1.22" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          }
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-foreground/70">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-background text-primary"
            />
            Remember me
          </label>
          <Link to="/auth/forgot-password" className="font-medium text-primary hover:text-primary/85">
            Forgot password?
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button type="submit" className="btn-shine h-12 w-full rounded-xl text-base font-semibold" isLoading={isSubmitting}>
            Sign In
          </Button>

          <Button
            type="button"
            variant="outline"
            className="h-12 w-full rounded-xl"
            onClick={handleGoogleLogin}
          >
            <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google Sign In
          </Button>
        </div>
      </form>

      <p className="mt-7 text-center text-base text-foreground/70">
        Don&apos;t have an account?{' '}
        <Link to="/auth/register" className="font-semibold text-primary hover:text-primary/85">
          Register
        </Link>
      </p>
    </div>
  );
}