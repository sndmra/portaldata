import axios, { AxiosError } from 'axios';

const API_KEY_STORAGE = 'ckan_api_key';
const USER_STORAGE = 'portal_user';
const SYSADMIN_STORAGE = 'ckan_sysadmin';

// Create a custom axios instance with interceptors
const api = axios.create();

// Response interceptor to handle 403 errors (deleted/invalid user)
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        // If we get a 403, the user's credentials are invalid (account deleted, token revoked, etc.)
        if (error.response?.status === 403 || error.response?.status === 401) {
            // Check if we have stored credentials (meaning user thought they were logged in)
            const hasStoredCredentials = typeof window !== 'undefined' && localStorage.getItem(API_KEY_STORAGE);

            if (hasStoredCredentials) {
                console.warn('Session invalid. Clearing credentials and redirecting to login.');

                // Clear all stored credentials
                localStorage.removeItem(API_KEY_STORAGE);
                localStorage.removeItem(USER_STORAGE);
                localStorage.removeItem(SYSADMIN_STORAGE);

                // Redirect to login page with a message
                if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
                    window.location.href = '/login?expired=true';
                }
            }
        }

        return Promise.reject(error);
    }
);

export default api;
