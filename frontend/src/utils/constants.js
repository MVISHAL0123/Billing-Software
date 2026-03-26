// Use appropriate API based on environment
const isProd = import.meta.env.PROD;
const baseUrl = isProd 
  ? '/api'  // Relative path - backend should be on same domain
  : (import.meta.env.VITE_API_URL || 'http://localhost:5003/api');

export const API_BASE_URL = baseUrl;

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  INVOICES: '/invoices',
  CUSTOMERS: '/customers',
};
