// Use current domain in production, fallback to localhost for development
const isProd = import.meta.env.PROD;
const baseUrl = isProd 
  ? `${window.location.origin}/api` 
  : (import.meta.env.VITE_API_URL || 'http://localhost:5003/api');

export const API_BASE_URL = baseUrl;

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  INVOICES: '/invoices',
  CUSTOMERS: '/customers',
};
