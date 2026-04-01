import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import api from '../../../core/api/client';

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
      await api.post('/auth/reset-password', { 
        token, 
        password: data.password 
      });
      
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 3000);
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'The reset link is invalid or expired.');
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
            type="password"
            label="New Password"
            {...register('password')}
            error={errors.password?.message}
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            {...register('confirmPassword')}
            error={errors.confirmPassword?.message}
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