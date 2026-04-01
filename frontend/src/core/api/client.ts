import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080') + '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies like refresh_token
});

api.interceptors.request.use((config) => {
  const tokenKey = import.meta.env.VITE_JWT_STORAGE_KEY || 'access_token';
  const token = localStorage.getItem(tokenKey);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
