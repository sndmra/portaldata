import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import { AdminSidebar, MaterialIcon } from './index';

interface SystemInfo {
    status: {
        ckan_version: string;
        site_url: string;
        site_title: string;
        locale_default: string;
        extensions: string[];
    };
    ckanUrl: string;
}

export default function AdminSystem() {
    const { isSysadmin, isLoading: authLoading, requireSysadmin, getApiKey } = useAuth();
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        requireSysadmin();
        if (isSysadmin) {
            fetchSystemInfo();
        }
    }, [isSysadmin, authLoading]);

    const fetchSystemInfo = async () => {
        try {
            const apiKey = getApiKey();
            const response = await axios.get('/api/admin/system', {
                headers: apiKey ? { Authorization: apiKey } : {}
            });
            setSystemInfo(response.data);
        } catch (err) {
            setError('Gagal memuat informasi sistem');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !isSysadmin) return null;

    return (
        <Layout title="Admin - Sistem">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    <AdminSidebar activeItem="system" />

                    <div className="flex-1 min-w-0">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-text">Informasi Sistem</h1>
                            <p className="text-muted mt-1">Konfigurasi dan status sistem</p>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
                                <MaterialIcon name="error" />
                                {error}
                            </div>
                        ) : systemInfo && (
                            <div className="space-y-6">
                                {/* CKAN Info */}
                                <div className="bg-white rounded-xl border border-border p-6">
                                    <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                                        <MaterialIcon name="dns" className="text-primary" />
                                        Konfigurasi CKAN
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Versi CKAN</label>
                                            <p className="font-mono text-text mt-1 text-lg font-semibold">
                                                {systemInfo.status?.ckan_version || 'Unknown'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Backend URL</label>
                                            <p className="font-mono text-text mt-1 truncate">
                                                {systemInfo.ckanUrl}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Site URL</label>
                                            <p className="font-mono text-text mt-1 truncate">
                                                {systemInfo.status?.site_url || '-'}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Default Locale</label>
                                            <p className="font-mono text-text mt-1">
                                                {systemInfo.status?.locale_default || 'en'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Extensions */}
                                {systemInfo.status?.extensions && systemInfo.status.extensions.length > 0 && (
                                    <div className="bg-white rounded-xl border border-border p-6">
                                        <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                                            <MaterialIcon name="extension" className="text-primary" />
                                            Extension Aktif
                                        </h2>
                                        <div className="flex flex-wrap gap-2">
                                            {systemInfo.status.extensions.map((ext: string) => (
                                                <span
                                                    key={ext}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded-lg text-sm font-mono text-gray-700"
                                                >
                                                    <MaterialIcon name="check_circle" className="text-sm text-emerald-500" />
                                                    {ext}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Frontend Info */}
                                <div className="bg-white rounded-xl border border-border p-6">
                                    <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                                        <MaterialIcon name="web" className="text-primary" />
                                        Frontend
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Framework</label>
                                            <p className="font-mono text-text mt-1 font-semibold">Next.js</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <label className="text-xs text-gray-500 uppercase tracking-wider">Environment</label>
                                            <p className="font-mono text-text mt-1">
                                                {process.env.NODE_ENV || 'development'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Health Status */}
                                <div className="bg-white rounded-xl border border-border p-6">
                                    <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                                        <MaterialIcon name="monitor_heart" className="text-primary" />
                                        Status Kesehatan
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <MaterialIcon name="check" className="text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-emerald-800">CKAN Backend</p>
                                                <p className="text-sm text-emerald-600">Terhubung</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <MaterialIcon name="check" className="text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-emerald-800">API</p>
                                                <p className="text-sm text-emerald-600">Beroperasi</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center">
                                                <MaterialIcon name="check" className="text-white" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-emerald-800">Autentikasi</p>
                                                <p className="text-sm text-emerald-600">Aktif</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
