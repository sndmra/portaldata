import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import Link from 'next/link';
import { useRouter } from 'next/router';

// Material Icon component for consistent styling
export function MaterialIcon({ name, className = '' }: { name: string; className?: string }) {
    return <span className={`material-icons ${className}`}>{name}</span>;
}

// Admin Navigation Sidebar Component
export function AdminSidebar({ activeItem }: { activeItem: string }) {
    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', href: '/admin', icon: 'dashboard' },
        { id: 'users', label: 'Pengguna', href: '/admin/users', icon: 'people' },
        { id: 'organizations', label: 'Organisasi', href: '/admin/organizations', icon: 'business' },
        { id: 'groups', label: 'Grup', href: '/admin/groups', icon: 'folder' },
        { id: 'datasets', label: 'Dataset', href: '/admin/datasets', icon: 'inventory_2' },
        { id: 'system', label: 'Sistem', href: '/admin/system', icon: 'settings' },
    ];

    return (
        <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-secondary px-6 py-4">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <MaterialIcon name="admin_panel_settings" className="text-xl" />
                        Admin Panel
                    </h2>
                </div>
                <nav className="p-3 space-y-1">
                    {menuItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeItem === item.id
                                ? 'bg-primary text-white shadow-md'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
                                }`}
                        >
                            <MaterialIcon name={item.icon} className="text-xl" />
                            {item.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}

interface DashboardStats {
    users: number;
    datasets: number;
    organizations: number;
    groups: number;
}

export default function AdminDashboard() {
    const { isSysadmin, isLoading: authLoading, requireSysadmin, getApiKey } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        requireSysadmin();
        if (isSysadmin) {
            fetchDashboard();
        }
    }, [isSysadmin, authLoading]);

    const fetchDashboard = async () => {
        try {
            const apiKey = getApiKey();
            const response = await axios.get('/api/admin/dashboard', {
                headers: apiKey ? { Authorization: apiKey } : {}
            });
            setStats(response.data.stats);
        } catch (err) {
            setError('Gagal memuat dashboard');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || !isSysadmin) return null;

    const statCards = [
        { label: 'Total Pengguna', value: stats?.users || 0, icon: 'people', color: 'from-blue-500 to-blue-600', href: '/admin/users' },
        { label: 'Total Dataset', value: stats?.datasets || 0, icon: 'inventory_2', color: 'from-emerald-500 to-emerald-600', href: '/admin/datasets' },
        { label: 'Organisasi', value: stats?.organizations || 0, icon: 'business', color: 'from-purple-500 to-purple-600', href: '/admin/organizations' },
        { label: 'Grup', value: stats?.groups || 0, icon: 'folder', color: 'from-amber-500 to-amber-600', href: '/admin/groups' },
    ];

    const quickActions = [
        { label: 'Tambah Pengguna', icon: 'person_add', href: '/admin/users' },
        { label: 'Organisasi Baru', icon: 'add_business', href: '/admin/organizations' },
        { label: 'Grup Baru', icon: 'create_new_folder', href: '/admin/groups' },
        { label: 'Info Sistem', icon: 'info', href: '/admin/system' },
    ];

    return (
        <Layout title="Admin Dashboard">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    <AdminSidebar activeItem="dashboard" />

                    <div className="flex-1 min-w-0">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-text">Dashboard</h1>
                            <p className="text-muted mt-1">Ringkasan statistik dan aksi cepat</p>
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
                        ) : (
                            <>
                                {/* Stats Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                                    {statCards.map((card) => (
                                        <Link
                                            key={card.label}
                                            href={card.href}
                                            className="bg-white rounded-xl border border-border p-5 hover:shadow-lg hover:border-primary/30 transition-all group"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-xs text-muted mb-1">{card.label}</p>
                                                    <p className="text-2xl font-bold text-text">{card.value}</p>
                                                </div>
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shadow group-hover:scale-110 transition-transform`}>
                                                    <MaterialIcon name={card.icon} className="text-white text-lg" />
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {/* Quick Actions */}
                                <div className="bg-white rounded-xl border border-border p-6">
                                    <h2 className="text-lg font-bold text-text mb-4 flex items-center gap-2">
                                        <MaterialIcon name="flash_on" className="text-primary" />
                                        Aksi Cepat
                                    </h2>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {quickActions.map((action) => (
                                            <Link
                                                key={action.label}
                                                href={action.href}
                                                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-gray-50 hover:bg-primary/5 hover:border-primary border border-transparent transition-all group"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center group-hover:border-primary group-hover:text-primary transition-colors">
                                                    <MaterialIcon name={action.icon} className="text-xl text-gray-500 group-hover:text-primary" />
                                                </div>
                                                <span className="text-xs font-medium text-gray-600 group-hover:text-primary text-center">{action.label}</span>
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
