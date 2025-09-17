import axios from 'axios';
import { supabase } from './SupabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:5000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.debug('[API] Session check:', { 
        hasSession: !!session, 
        hasToken: !!session?.access_token,
        url: config.url,
        tokenPreview: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'none'
      });
      if (session?.access_token) {
        // Backend expects clean Bearer token, not JSON-wrapped
        config.headers.Authorization = `Bearer ${session.access_token}`;
      } else {
        console.warn('[API] No access token available for request to:', config.url);
        // Remove any existing Authorization header if no token
        delete config.headers.Authorization;
      }
    } catch (error) {
      console.error('Failed to get session for API request:', error);
      // Remove Authorization header on error
      delete config.headers.Authorization;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token might be expired, could redirect to login
      console.warn('API request unauthorized - token may be expired');
    }
    return Promise.reject(error);
  }
);

export default api;

