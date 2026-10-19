import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
  withCredentials: true,
});

// Initialize auth from storage on client side
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('fabribat_auth_token');
  if (storedToken) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
  }
}

// Response interceptor for error handling and auth
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || 'Error inesperado de red';

    // Handle 401 Unauthorized - clear session and redirect to login
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('fabribat_auth_token');
        localStorage.removeItem('fabribat_auth_user');
        delete apiClient.defaults.headers.common['Authorization'];
        // Use replace to avoid history stack issues
        window.location.replace('/login?expired=1');
      }
    }

    // Handle 403 Forbidden - token may be valid but insufficient permissions
    if (error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        // Could redirect to an unauthorized page or show toast
        // For now, just log and let the error propagate
      }
    }

    console.error('API Error:', message);
    return Promise.reject(
      new Error(typeof message === 'object' ? JSON.stringify(message) : message)
    );
  }
);

/**
 * Set the auth token in axios defaults and localStorage
 */
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    if (typeof window !== 'undefined') {
      localStorage.setItem('fabribat_auth_token', token);
    }
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fabribat_auth_token');
    }
  }
};

/**
 * Initialize auth from localStorage on client-side
 * Call this once during app initialization (e.g., in AuthProvider)
 */
export const initializeAuthFromStorage = () => {
  if (typeof window !== 'undefined') {
    const storedToken = localStorage.getItem('fabribat_auth_token');
    if (storedToken) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
    }
  }
};