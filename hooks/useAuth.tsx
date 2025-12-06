import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

const API_KEY_STORAGE = 'ckan_api_key';
const USER_STORAGE = 'portal_user';
const SYSADMIN_STORAGE = 'ckan_sysadmin';

export function useAuth() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [isSysadmin, setIsSysadmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Clear all stored credentials
    const clearCredentials = () => {
        localStorage.removeItem(API_KEY_STORAGE);
        localStorage.removeItem(USER_STORAGE);
        localStorage.removeItem(SYSADMIN_STORAGE);
        setApiKey(null);
        setUser(null);
        setIsSysadmin(false);
    };

    useEffect(() => {
        const validateSession = async () => {
            const storedKey = localStorage.getItem(API_KEY_STORAGE);
            const storedUser = localStorage.getItem(USER_STORAGE);
            const storedSysadmin = localStorage.getItem(SYSADMIN_STORAGE) === 'true';

            // If no stored credentials, just finish loading
            if (!storedKey || !storedUser) {
                setIsLoading(false);
                return;
            }

            const userData = JSON.parse(storedUser);

            // Validate the session by checking if user exists
            try {
                const response = await axios.get('/api/profile', {
                    params: { action: 'user', userId: userData.id },
                    headers: { Authorization: storedKey }
                });

                if (response.data.success) {
                    // Session is valid
                    setApiKey(storedKey);
                    setUser(userData);
                    setIsSysadmin(storedSysadmin);
                } else {
                    // Session invalid - clear credentials
                    clearCredentials();
                    if (!window.location.pathname.startsWith('/login')) {
                        router.push('/login?expired=true');
                    }
                }
            } catch (error: any) {
                // If we get 403 or 404, user doesn't exist anymore
                if (error.response?.status === 403 || error.response?.status === 404 || error.response?.status === 500) {
                    clearCredentials();
                    if (!window.location.pathname.startsWith('/login')) {
                        router.push('/login?expired=true');
                    }
                } else {
                    // For network errors, still set the cached credentials but user might see errors
                    setApiKey(storedKey);
                    setUser(userData);
                    setIsSysadmin(storedSysadmin);
                }
            } finally {
                setIsLoading(false);
            }
        };

        validateSession();
    }, []);

    const login = (key: string, userData: any, isSysadminUser: boolean = false) => {
        localStorage.setItem(API_KEY_STORAGE, key);
        localStorage.setItem(USER_STORAGE, JSON.stringify(userData));
        localStorage.setItem(SYSADMIN_STORAGE, String(isSysadminUser));

        setApiKey(key);
        setUser(userData);
        setIsSysadmin(isSysadminUser);
    };

    const logout = () => {
        clearCredentials();
        router.push('/login');
    };

    const isAuthenticated = (): boolean => {
        return !!apiKey;
    };

    const getApiKey = (): string | null => {
        return apiKey;
    };

    const requireAuth = (redirectTo: string = '/login') => {
        if (!isLoading && !isAuthenticated()) {
            router.push(redirectTo);
        }
    };

    const requireSysadmin = (redirectTo: string = '/') => {
        if (!isLoading) {
            if (!isAuthenticated()) {
                router.push('/login');
            } else if (!isSysadmin) {
                router.push(redirectTo);
            }
        }
    };

    const updateUser = (userData: any) => {
        localStorage.setItem(USER_STORAGE, JSON.stringify(userData));
        setUser(userData);
    };

    return {
        apiKey,
        user,
        isSysadmin,
        isLoading,
        login,
        logout,
        updateUser,
        isAuthenticated,
        getApiKey,
        requireAuth,
        requireSysadmin,
    };
}
