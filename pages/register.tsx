import { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullname: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/api/register', formData);

            if (response.data.success) {
                // Redirect to login page with success message (could be passed via query param)
                router.push('/login?registered=true');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout title="Register - Portal Data Nusantara">
            <div className="max-w-md mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-8 border border-border">
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-primary mb-2">Buat Akun Baru</h1>
                        <p className="text-muted">
                            Daftar untuk mulai mengunggah dan mengelola dataset Anda.
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div>
                            <label htmlFor="fullname" className="block text-sm font-medium text-text">
                                Nama Lengkap
                            </label>
                            <div className="mt-1">
                                <input
                                    id="fullname"
                                    name="fullname"
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="Nama Lengkap Anda"
                                    value={formData.fullname}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

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
                                    pattern="[a-z0-9_\-]*"
                                    title="Hanya huruf kecil, angka, garis bawah, dan tanda hubung diperbolehkan"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="username_anda"
                                    value={formData.username}
                                    onChange={handleChange}
                                />
                                <p className="mt-1 text-xs text-gray-500">Hanya huruf kecil, angka, '_', dan '-'</p>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-text">
                                Email
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="email@contoh.com"
                                    value={formData.email}
                                    onChange={handleChange}
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
                                    minLength={8}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                                    placeholder="Minimal 8 karakter"
                                    value={formData.password}
                                    onChange={handleChange}
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
                                {loading ? 'Memproses...' : 'Daftar'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Sudah punya akun?{' '}
                            <Link href="/login" className="font-medium text-primary hover:text-secondary">
                                Masuk di sini
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
