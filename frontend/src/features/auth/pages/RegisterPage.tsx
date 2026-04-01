import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../../../shared/components/ui/Button';
import { Input } from '../../../shared/components/ui/Input';
import api from '../../../core/api/client';

// Schemas for the 3 steps
const step1Schema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
});

const step2Schema = z.object({
  code: z.string().min(6, 'Verification code must be 6 characters'),
});

const step3Schema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;
type Step3Values = z.infer<typeof step3Schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [serverError, setServerError] = useState('');
  const stepItems = ['Account Info', 'Verify Email', 'Set Password'] as const;
  
  // Stored state between steps
  const [userData, setUserData] = useState({ name: '', email: '', code: '' });

  // Hook forms for each step
  const formStep1 = useForm<Step1Values>({ resolver: zodResolver(step1Schema) });
  const formStep2 = useForm<Step2Values>({ resolver: zodResolver(step2Schema) });
  const formStep3 = useForm<Step3Values>({ resolver: zodResolver(step3Schema) });

  const onStep1Submit = async (data: Step1Values) => {
    try {
      setServerError('');
      const fullName = `${data.firstName.trim()} ${data.lastName.trim()}`.trim();

      await api.post('/auth/register/request-code', {
        name: fullName,
        email: data.email,
      });
      setUserData((prev) => ({ ...prev, name: fullName, email: data.email }));
      setStep(2);
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to send verification code. Email might be in use.');
    }
  };

  const onStep2Submit = async (data: Step2Values) => {
    try {
      setServerError('');
      await api.post('/auth/register/verify-code', {
        email: userData.email,
        code: data.code,
      });
      setUserData((prev) => ({ ...prev, code: data.code }));
      setStep(3);
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Invalid or expired verification code.');
    }
  };

  const onStep3Submit = async (data: Step3Values) => {
    try {
      setServerError('');
      await api.post('/auth/register/set-password', {
        email: userData.email,
        code: userData.code, // sending code again just in case backend expects it
        password: data.password,
      });
      
      // Successfully registered => login
      navigate('/auth/login', { replace: true, state: { message: 'Registration successful! You can now log in.' } });
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Failed to set password. Please try again.');
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = import.meta.env.VITE_OAUTH_START_URL || 'http://localhost:8080/oauth2/authorization/google';
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="mt-6 text-3xl font-bold tracking-tight text-foreground">Create an account</h2>
        <p className="mt-2 text-sm text-foreground/70">Register your details to continue</p>
      </div>

      <div className="mb-8">
        <div className="relative px-5">
          <div className="relative h-11">
            <div className="absolute left-5 right-5 top-1/2 h-0.5 -translate-y-1/2 bg-border/70" />
            <div className="relative z-10 grid h-full grid-cols-3 place-items-center">
              {[1, 2, 3].map((index) => {
                const isActive = step === index;
                const isCompleted = step > index;

                return (
                  <div
                    key={index}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-all ${
                      isActive
                        ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_0_4px_rgba(249,115,22,0.2)]'
                        : isCompleted
                          ? 'border-primary/70 bg-primary/15 text-primary'
                          : 'border-border bg-background/80 text-foreground/75'
                    }`}
                  >
                    {index}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-2 grid grid-cols-3 place-items-center">
            {[1, 2, 3].map((index) => {
              const isActive = step === index;

              return (
                <div key={index} className="w-24 text-center">
                  <span
                    className={`whitespace-nowrap text-xs font-medium ${
                      isActive ? 'text-foreground' : 'text-foreground/70'
                    }`}
                  >
                    {stepItems[index - 1]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {step === 1 && (
        <form className="space-y-6" onSubmit={formStep1.handleSubmit(onStep1Submit)}>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="firstName"
              label="First Name"
              placeholder="First name"
              autoComplete="given-name"
              className="h-12 rounded-xl border-border/80 bg-background/60"
              {...formStep1.register('firstName')}
              error={formStep1.formState.errors.firstName?.message}
            />

            <Input
              id="lastName"
              label="Last Name"
              placeholder="Last name"
              autoComplete="family-name"
              className="h-12 rounded-xl border-border/80 bg-background/60"
              {...formStep1.register('lastName')}
              error={formStep1.formState.errors.lastName?.message}
            />
          </div>

          <Input
            id="email"
            type="email"
            label="Email"
            placeholder="Enter your email"
            autoComplete="email"
            className="h-12 rounded-xl border-border/80 bg-background/60"
            {...formStep1.register('email')}
            error={formStep1.formState.errors.email?.message}
          />

          {serverError && (
            <div className="text-error text-sm text-center bg-error/10 py-2 rounded">
              {serverError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="submit"
              className="btn-shine h-12 w-full rounded-xl text-base font-semibold"
              isLoading={formStep1.formState.isSubmitting}
            >
              Send Code
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

          <p className="text-center text-sm text-foreground/70">
            Already have an account?{' '}
            <Link to="/auth/login" className="font-medium text-primary hover:text-primary/80">
              Sign in
            </Link>
          </p>
        </form>
      )}

      {step === 2 && (
        <form className="space-y-6" onSubmit={formStep2.handleSubmit(onStep2Submit)}>
          <div className="text-sm bg-muted/30 p-3 rounded-md mb-4 text-foreground/80">
            We've sent a verification code to <span className="font-semibold text-foreground">{userData.email}</span>. Please enter it below.
          </div>

          <Input
            id="code"
            label="Verification Code"
            type="text"
            maxLength={6}
            {...formStep2.register('code')}
            error={formStep2.formState.errors.code?.message}
          />

          {serverError && (
            <div className="text-error text-sm text-center bg-error/10 py-2 rounded">
              {serverError}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <Button type="submit" className="w-full" isLoading={formStep2.formState.isSubmitting}>
              Verify Code
            </Button>
            <Button type="button" variant="ghost" onClick={() => setStep(1)} disabled={formStep2.formState.isSubmitting}>
              Back
            </Button>
          </div>
        </form>
      )}

      {step === 3 && (
        <form className="space-y-6" onSubmit={formStep3.handleSubmit(onStep3Submit)}>
          <div className="text-sm bg-success/10 p-3 rounded-md mb-4 text-success relative border border-success/30">
            Code verified successfully. Please secure your account.
          </div>

          <Input
            id="password"
            type="password"
            label="Create Password"
            {...formStep3.register('password')}
            error={formStep3.formState.errors.password?.message}
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            {...formStep3.register('confirmPassword')}
            error={formStep3.formState.errors.confirmPassword?.message}
          />

          {serverError && (
            <div className="text-error text-sm text-center bg-error/10 py-2 rounded">
              {serverError}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={formStep3.formState.isSubmitting}>
            Complete Registration
          </Button>
        </form>
      )}
    </div>
  );
}