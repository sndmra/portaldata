import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

import Link from 'next/link';



export default function Login() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading } = useAuth(); // Keep isAuthenticated and isLoading
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { registered, expired } = router.query; // Get query params

    useEffect(() => {
        // Redirect to upload if already authenticated
        if (!isLoading && isAuthenticated()) {
            router.push('/');
        }
    }, [isLoading, isAuthenticated, router]);

    const handleLogin = async (e: React.FormEvent) => { // Renamed from handleSubmit to handleLogin to match original
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // 1. Login to get API Key (using our proxy API)
            // Use validateStatus to prevent axios from throwing on 4xx errors
            const loginRes = await axios.post('/api/login', {
                username: username,
                password: password
            }, {
                validateStatus: (status) => status < 500 // Don't throw on 4xx, only on 5xx
            });

            if (loginRes.data.success) {
                const apiKey = loginRes.data.apikey;
                const user = loginRes.data.user;

                // 2. Check if user is sysadmin (optional, but good for UI)
                const isSysadmin = user.sysadmin;

                login(apiKey, user, isSysadmin);

                // Check for redirect query param
                const { redirect } = router.query;
                if (redirect && typeof redirect === 'string') {
                    router.push(redirect);
                } else {
                    router.push('/');
                }
            } else {
                // Login failed - show error message from response
                const errorMessage = loginRes.data.message || 'Login gagal. Periksa username dan password Anda.';
                setError(errorMessage);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            // Only network/server errors should reach here
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error?.message ||
                'Terjadi kesalahan server. Silakan coba lagi.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Layout title="Login - Portal Data Nusantara">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-muted">Loading...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Login - Portal Data Nusantara">
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8 border border-border">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-primary mb-2">Login</h1>
                        <p className="text-muted">
                            Masukkan username dan password Anda untuk mengakses fitur upload dataset.
                        </p>
                    </div>

                    {expired && (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md text-amber-700 text-sm flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Sesi Anda telah berakhir atau akun tidak ditemukan. Silakan login kembali.
                        </div>
                    )}

                    {registered && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md text-green-700 text-sm flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Registrasi berhasil! Silakan login dengan akun baru Anda.
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-text">
                                Username
                            </label>
                            <div className="mt-1">
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="Masukkan username CKAN Anda"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-text">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="Masukkan password Anda"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        {error && (
                            <p className="mt-2 text-sm text-red-600 flex items-start">
                                <svg className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {error}
                            </p>
                        )}
                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Memproses...' : 'Masuk'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Belum punya akun?{' '}
                            <Link href="/register" className="font-medium text-primary hover:text-secondary">
                                Daftar di sini
                            </Link>
                        </p>
                    </div>
                </div >
            </div >
        </Layout >
    );
}
