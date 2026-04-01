import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { authApi } from '../../../core/api/authApi';
import type { ApiErrorResponse } from '../../../types/api';

const resetPasswordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!token) {
      setServerError('Wait! The password reset token is missing from the URL.');
      return;
    }

    try {
      setServerError('');
      // Adjust with real endpoint
      await authApi.resetPassword({ 
        token, 
        password: data.password 
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 3000);
    } catch (err: unknown) {
      const message = axios.isAxiosError<ApiErrorResponse>(err)
        ? err.response?.data?.message
        : undefined;
      setServerError(message || 'The reset link is invalid or expired.');
    }
  };

  if (!token && !success) {
    return (
      <div className="w-full max-w-md mx-auto text-center mt-12">
        <h2 className="text-xl font-bold text-error mb-4">Invalid Reset Link</h2>
        <p className="text-foreground/70 mb-6">The password reset link is missing or invalid. Please request a new one.</p>
        <Link to="/auth/forgot-password">
          <Button variant="primary">Request New Link</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">Create new password</h2>
        <p className="mt-2 text-sm text-foreground/70">
          Please enter your secure new password below.
        </p>
      </div>

      {success ? (
        <div className="text-center space-y-6">
          <div className="text-sm bg-success/10 p-4 rounded-md text-success relative border border-success/30">
            Password reset successfully. Redirecting to login...
          </div>
          <Link to="/auth/login" className="block">
            <Button type="button" className="w-full">
              Go to Login Now
            </Button>
          </Link>
        </div>
      ) : (
        <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            label="New Password"
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

          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
            helperText="Must match your password and be at least 8 characters"
            endAdornment={
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="rounded p-1 text-foreground/60 hover:text-foreground"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
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

          {serverError && (
            <div className="text-error text-sm text-center bg-error/10 py-2 rounded">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isSubmitting}>
            Reset Password
          </Button>
        </form>
      )}
    </div>
  );
}