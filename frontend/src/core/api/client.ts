import axios from 'axios';

type RetryableConfig = {
  _retry?: boolean;
  headers?: Record<string, string>;
  url?: string;
};

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies like refresh_token
});

const tokenKey = import.meta.env.VITE_JWT_STORAGE_KEY || 'access_token';
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '/api';

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  try {
    const response = await axios.post<{ accessToken: string }>(
      `${apiBaseUrl}/auth/refresh`,
      {},
      {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' },
      },
    );

    const newToken = response.data?.accessToken;
    if (!newToken) {
      return null;
    }

    localStorage.setItem(tokenKey, newToken);
    return newToken;
  } catch {
    localStorage.removeItem(tokenKey);
    return null;
  }
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(tokenKey);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config as RetryableConfig | undefined;

    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }

    const requestUrl = originalRequest.url ?? '';
    const isAuthRoute = requestUrl.includes('/auth/login') || requestUrl.includes('/auth/refresh');
    const hasToken = Boolean(localStorage.getItem(tokenKey));

    if (originalRequest._retry || isAuthRoute || !hasToken) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const refreshedToken = await refreshPromise;

    if (!refreshedToken) {
      if (!window.location.pathname.startsWith('/auth/login')) {
        window.location.assign('/auth/login');
      }
      return Promise.reject(error);
    }

    originalRequest.headers = {
      ...(originalRequest.headers ?? {}),
      Authorization: `Bearer ${refreshedToken}`,
    };

    return api(originalRequest);
  },
);

export default api;
