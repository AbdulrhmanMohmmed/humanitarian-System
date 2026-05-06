/**
 * HIAOS API Service
 * - JWT auth header injection
 * - Automatic token refresh (silent re-auth)
 * - Request queuing during token refresh
 * - Global error handling with Arabic messages
 */

import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Token Management ──────────────────────────────────────────────────────────

const getToken = () => localStorage.getItem('token');
const getRefreshToken = () => localStorage.getItem('refresh_token');

const setTokens = (accessToken, refreshToken) => {
  localStorage.setItem('token', accessToken);
  if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
};

const clearTokens = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// ── Refresh Token Logic ───────────────────────────────────────────────────────

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  failedQueue = [];
};

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  const response = await axios.post(`${BASE_URL}/api/auth/refresh`, {
    refresh_token: refreshToken,
  });

  const { access_token, refresh_token, user } = response.data;
  setTokens(access_token, refresh_token);
  if (user) localStorage.setItem('user', JSON.stringify(user));
  return access_token;
}

// ── Request Interceptor ───────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    // Automatically prepend /api if missing, except for health/metrics endpoints
    if (
      config.url &&
      !config.url.startsWith('/api') &&
      !config.url.startsWith('/health') &&
      !config.url.startsWith('/metrics') &&
      !config.url.startsWith('http')
    ) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }

    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ──────────────────────────────────────────────────────

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 — try refresh token
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        // Queue this request until refresh completes
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        // Redirect to login if not already there
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 — insufficient permissions
    if (error.response?.status === 403) {
      console.warn('[API] Access denied:', originalRequest.url);
    }

    // Handle 429 — rate limited
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      console.warn(`[API] Rate limited. Retry after ${retryAfter}s`);
      error.userMessage = `تجاوزت الحد المسموح من الطلبات. حاول مرة أخرى خلال ${retryAfter} ثانية.`;
    }

    // Handle 500+ server errors
    if (error.response?.status >= 500) {
      error.userMessage = 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى أو التواصل مع الدعم الفني.';
    }

    // Handle network errors (offline)
    if (!error.response) {
      error.userMessage = 'لا يوجد اتصال بالإنترنت. يعمل النظام في وضع عدم الاتصال.';
      error.isNetworkError = true;
    }

    return Promise.reject(error);
  },
);

// ── Typed Helpers ─────────────────────────────────────────────────────────────

export const authApi = {
  login: (username, password) => api.post('/api/auth/login', { username, password }),
  refresh: (refreshToken) => api.post('/api/auth/refresh', { refresh_token: refreshToken }),
  me: () => api.get('/api/auth/me'),
  changePassword: (data) => api.put('/api/auth/me/password', data),
  users: () => api.get('/api/auth/users'),
};

export const healthApi = {
  check: () => api.get('/health'),
  ready: () => api.get('/health/ready'),
  metrics: () => api.get('/metrics'),
};

export default api;
