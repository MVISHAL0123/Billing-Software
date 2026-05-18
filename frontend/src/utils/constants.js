// Use appropriate API based on environment
const isProd = import.meta.env.PROD;
const baseUrl = isProd 
  ? (import.meta.env.VITE_API_URL || '/api')  // Production: use env var or relative path
  : (import.meta.env.VITE_API_URL || 'http://localhost:5003/api');  // Development: local backend

export const API_BASE_URL = baseUrl;
console.log('API Base URL:', API_BASE_URL, 'Prod:', isProd);

export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/dashboard',
  INVOICES: '/invoices',
  CUSTOMERS: '/customers',
};
