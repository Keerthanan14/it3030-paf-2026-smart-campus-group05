import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../core/api/client';
import { useAuthStore } from '../../../core/store/authStore';
import { redirectByRole } from '../utils/redirectByRole';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [statusMessage, setStatusMessage] = useState('Completing Google sign-in...');

  useEffect(() => {
    const completeOAuthLogin = async () => {
      const oauthError = searchParams.get('error');
      if (oauthError) {
        navigate('/auth/login', {
          replace: true,
          state: { message: 'Google login failed. Please try again.' },
        });
        return;
      }

      const token = searchParams.get('token');
      if (!token) {
        navigate('/auth/login', {
          replace: true,
          state: { message: 'Google login failed: token missing.' },
        });
        return;
      }

      try {
        setStatusMessage('Fetching your profile...');
        const userResponse = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAuth(userResponse.data, token);
        redirectByRole(userResponse.data.role, navigate);
      } catch {
        navigate('/auth/login', {
          replace: true,
          state: { message: 'Google login failed while loading profile.' },
        });
      }
    };

    void completeOAuthLogin();
  }, [navigate, searchParams, setAuth]);

  return (
    <div className="w-full text-center">
      <h2 className="text-2xl font-bold text-foreground">Signing you in...</h2>
      <p className="mt-3 text-sm text-foreground/70">{statusMessage}</p>
    </div>
  );
}
