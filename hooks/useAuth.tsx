import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getCkanUrl } from '@/lib/ckan'; // Added this import

const API_KEY_STORAGE = 'ckan_api_key';
const USER_STORAGE = 'portal_user';
const SYSADMIN_STORAGE = 'ckan_sysadmin';

export function useAuth() {
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [user, setUser] = useState<any | null>(null);
    const [isSysadmin, setIsSysadmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Load API key, user, and sysadmin status from localStorage on mount
        const storedKey = localStorage.getItem(API_KEY_STORAGE);
        const storedUser = localStorage.getItem(USER_STORAGE);
        const storedSysadmin = localStorage.getItem(SYSADMIN_STORAGE) === 'true';

        setApiKey(storedKey);
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setIsSysadmin(storedSysadmin);
        setIsLoading(false);
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
        localStorage.removeItem(API_KEY_STORAGE);
        localStorage.removeItem(USER_STORAGE);
        localStorage.removeItem(SYSADMIN_STORAGE);
        setApiKey(null);
        setUser(null);
        setIsSysadmin(false);
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
