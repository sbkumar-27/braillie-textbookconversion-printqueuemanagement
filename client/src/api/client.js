/**
 * api/client.js
 * 
 * Centralized Axios HTTP client.
 * Automatically attaches the JWT token to every outgoing request.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: add JWT Bearer token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('braillie_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/register');
    if (error.response && error.response.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('braillie_token');
      localStorage.removeItem('braillie_user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
