import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import { AdminSidebar, MaterialIcon } from './index';

interface Group {
    id: string;
    name: string;
    title: string;
    description: string;
    created: string;
    package_count: number;
}

export default function AdminGroups() {
    const { isSysadmin, isLoading: authLoading, requireSysadmin, getApiKey } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroup, setNewGroup] = useState({ name: '', title: '', description: '' });
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => {
        requireSysadmin();
        if (isSysadmin) {
            fetchGroups();
        }
    }, [isSysadmin, authLoading]);

    const getAuthHeaders = () => {
        const apiKey = getApiKey();
        return apiKey ? { Authorization: apiKey } : {};
    };

    const fetchGroups = async () => {
        try {
            const response = await axios.get('/api/admin/groups', {
                headers: getAuthHeaders()
            });
            setGroups(response.data.groups);
        } catch (err) {
            setError('Gagal memuat grup');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Apakah Anda yakin ingin menghapus grup "${name}"?`)) return;

        try {
            await axios.delete(`/api/admin/groups?id=${id}`, {
                headers: getAuthHeaders()
            });
            setGroups(groups.filter(g => g.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.message || 'Gagal menghapus grup');
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateLoading(true);
        try {
            const response = await axios.post('/api/admin/groups', newGroup, {
                headers: getAuthHeaders()
            });
            setGroups([...groups, response.data.group]);
            setShowCreateModal(false);
            setNewGroup({ name: '', title: '', description: '' });
        } catch (err: any) {
            alert(err.response?.data?.message || 'Gagal membuat grup');
        } finally {
            setCreateLoading(false);
        }
    };

    if (authLoading || !isSysadmin) return null;

    return (
        <Layout title="Admin - Grup">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    <AdminSidebar activeItem="groups" />

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-text">Manajemen Grup</h1>
                                <p className="text-muted mt-1">{groups.length} grup terdaftar</p>
                            </div>
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-secondary transition flex items-center gap-2 shadow-sm"
                            >
                                <MaterialIcon name="add" className="text-xl" />
                                Grup Baru
                            </button>
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
                        ) : groups.length === 0 ? (
                            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <MaterialIcon name="folder" className="text-6xl text-gray-300 mb-4" />
                                <p className="text-muted">Belum ada grup. Buat grup pertama Anda!</p>
                            </div>
                        ) : (
                            <div className="bg-white shadow-sm rounded-xl border border-border overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Grup</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dataset</th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dibuat</th>
                                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {groups.map((group) => (
                                            <tr key={group.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold shadow-sm">
                                                            {group.title.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="text-sm font-semibold text-gray-900">{group.title}</div>
                                                            <div className="text-xs text-gray-500">@{group.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">
                                                        <MaterialIcon name="inventory_2" className="text-sm" />
                                                        {group.package_count || 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-500">
                                                    {group.created ? new Date(group.created).toLocaleDateString('id-ID') : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDelete(group.id, group.title)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                        title="Hapus"
                                                    >
                                                        <MaterialIcon name="delete" className="text-xl" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Create Modal */}
                        {showCreateModal && (
                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                                <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <MaterialIcon name="create_new_folder" className="text-primary text-xl" />
                                        </div>
                                        <h2 className="text-xl font-bold text-text">Buat Grup Baru</h2>
                                    </div>
                                    <form onSubmit={handleCreate} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nama (URL slug)</label>
                                            <input
                                                type="text"
                                                required
                                                pattern="[a-z0-9-]+"
                                                className="block w-full border border-gray-200 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                                value={newGroup.name}
                                                onChange={e => setNewGroup({ ...newGroup, name: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                                                placeholder="grup-saya"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Judul</label>
                                            <input
                                                type="text"
                                                required
                                                className="block w-full border border-gray-200 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                                value={newGroup.title}
                                                onChange={e => setNewGroup({ ...newGroup, title: e.target.value })}
                                                placeholder="Grup Saya"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                            <textarea
                                                className="block w-full border border-gray-200 rounded-lg py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                                rows={3}
                                                value={newGroup.description}
                                                onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
                                            />
                                        </div>
                                        <div className="flex justify-end gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => setShowCreateModal(false)}
                                                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={createLoading}
                                                className="px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary hover:bg-secondary transition flex items-center gap-2"
                                            >
                                                {createLoading ? (
                                                    <>
                                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                                        Membuat...
                                                    </>
                                                ) : (
                                                    <>
                                                        <MaterialIcon name="check" className="text-lg" />
                                                        Buat
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
