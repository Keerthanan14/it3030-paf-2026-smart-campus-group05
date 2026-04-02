import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import { authApi } from '../../../core/api/authApi';
import type { ApiErrorResponse } from '../../../types/api';
import { useToast } from '../../../shared/components/ui/ToastProvider';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [hasSentCode, setHasSentCode] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const toast = useToast();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  const formatCooldown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const sendResetRequest = async (email: string) => {
    try {
      await authApi.forgotPassword({ email });
      toast.success('Request sent', 'If an account matches that email, a password reset link has been sent.');
      setHasSentCode(true);
      setCooldownSeconds(60);
    } catch (err: unknown) {
      const message = axios.isAxiosError<ApiErrorResponse>(err)
        ? err.response?.data?.message
        : undefined;
      toast.error('Request failed', message || 'Unable to process your request at this time.');
    }
  };

  const onSubmit = async (data: ForgotPasswordValues) => {
    await sendResetRequest(data.email);
  };

  const handleResend = async () => {
    const email = getValues('email');
    const parsed = forgotPasswordSchema.safeParse({ email });

    if (!parsed.success) {
      toast.warning('Invalid email', parsed.error.issues[0]?.message || 'Enter a valid email address.');
      return;
    }

    setIsResending(true);
    await sendResetRequest(parsed.data.email);
    setIsResending(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">Reset your password</h2>
      </div>

      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <div className="text-sm text-foreground/80 mb-4">
          Enter your email address and we&apos;ll send you a code.
        </div>

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

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send
        </Button>

        {hasSentCode && (
          <div className="text-center text-sm text-foreground/70">
            {cooldownSeconds > 0 ? (
              <span>Resend available in {formatCooldown(cooldownSeconds)}</span>
            ) : (
              <button
                type="button"
                className="font-medium text-primary hover:text-primary/80"
                onClick={handleResend}
                disabled={isSubmitting || isResending}
              >
                {isResending ? 'Resending...' : 'Resend'}
              </button>
            )}
          </div>
        )}

        <p className="text-center text-sm text-foreground/70">
          Remember your password?{' '}
          <Link to="/auth/login" className="font-medium text-primary hover:text-primary/80">
            Sign in
          </Link>
        </p>

      </form>
    </div>
  );
}