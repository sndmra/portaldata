import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/Layout';
import { useAuth } from '../../hooks/useAuth';
import { AdminSidebar, MaterialIcon } from './index';
import Link from 'next/link';

interface Dataset {
    id: string;
    name: string;
    title: string;
    private: boolean;
    metadata_modified: string;
    num_resources: number;
    organization?: { title: string };
}

type SortField = 'title' | 'organization' | 'private' | 'metadata_modified';
type SortOrder = 'asc' | 'desc';

export default function AdminDatasets() {
    const { isSysadmin, isLoading: authLoading, requireSysadmin, getApiKey } = useAuth();
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [sortField, setSortField] = useState<SortField>('title');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    useEffect(() => {
        requireSysadmin();
        if (isSysadmin) {
            fetchDatasets();
        }
    }, [isSysadmin, authLoading]);

    const getAuthHeaders = () => {
        const apiKey = getApiKey();
        return apiKey ? { Authorization: apiKey } : {};
    };

    const fetchDatasets = async (query?: string) => {
        setLoading(true);
        try {
            const response = await axios.get('/api/admin/datasets', {
                headers: getAuthHeaders(),
                params: { q: query || '' }
            });
            setDatasets(response.data.datasets);
            setTotalCount(response.data.count);
            setSelectedIds(new Set());
        } catch (err) {
            setError('Gagal memuat dataset');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchDatasets(searchQuery);
    };

    const handleDelete = async (id: string, title: string, purge: boolean = false) => {
        const action = purge ? 'menghapus permanen' : 'menghapus';
        if (!confirm(`Apakah Anda yakin ingin ${action} dataset "${title}"?${purge ? '\n\nAksi ini TIDAK DAPAT dibatalkan!' : ''}`)) return;

        try {
            await axios.delete(`/api/admin/datasets?id=${id}&purge=${purge}`, {
                headers: getAuthHeaders()
            });
            setDatasets(datasets.filter(d => d.id !== id));
            setTotalCount(prev => prev - 1);
            setSelectedIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (err: any) {
            alert(err.response?.data?.message || 'Gagal menghapus dataset');
        }
    };

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === datasets.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(datasets.map(d => d.id)));
        }
    };

    const handleBulkDelete = async (purge: boolean = false) => {
        const count = selectedIds.size;
        const action = purge ? 'menghapus permanen' : 'menghapus';
        if (!confirm(`Apakah Anda yakin ingin ${action} ${count} dataset?${purge ? '\n\nAksi ini TIDAK DAPAT dibatalkan!' : ''}`)) return;

        setBulkDeleting(true);
        let successCount = 0;
        let failCount = 0;

        for (const id of selectedIds) {
            try {
                await axios.delete(`/api/admin/datasets?id=${id}&purge=${purge}`, {
                    headers: getAuthHeaders()
                });
                successCount++;
            } catch (err) {
                failCount++;
            }
        }

        await fetchDatasets(searchQuery);
        setBulkDeleting(false);

        if (failCount > 0) {
            alert(`Berhasil menghapus ${successCount} dataset, ${failCount} gagal.`);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const sortedDatasets = [...datasets].sort((a, b) => {
        let aVal: string | boolean | number;
        let bVal: string | boolean | number;

        switch (sortField) {
            case 'title':
                aVal = a.title.toLowerCase();
                bVal = b.title.toLowerCase();
                break;
            case 'organization':
                aVal = (a.organization?.title || '').toLowerCase();
                bVal = (b.organization?.title || '').toLowerCase();
                break;
            case 'private':
                aVal = a.private ? 1 : 0;
                bVal = b.private ? 1 : 0;
                break;
            case 'metadata_modified':
                aVal = new Date(a.metadata_modified).getTime();
                bVal = new Date(b.metadata_modified).getTime();
                break;
            default:
                return 0;
        }

        if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
        return 0;
    });

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <MaterialIcon name="unfold_more" className="text-sm text-gray-400" />;
        return <MaterialIcon name={sortOrder === 'asc' ? 'arrow_upward' : 'arrow_downward'} className="text-sm text-primary" />;
    };

    if (authLoading || !isSysadmin) return null;

    const allSelected = datasets.length > 0 && selectedIds.size === datasets.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < datasets.length;

    return (
        <Layout title="Admin - Dataset">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex gap-8">
                    <AdminSidebar activeItem="datasets" />

                    <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-text">Manajemen Dataset</h1>
                                <p className="text-muted mt-1">{totalCount} dataset terdaftar</p>
                            </div>
                        </div>

                        {/* Search Bar */}
                        <form onSubmit={handleSearch} className="mb-4">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <MaterialIcon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari dataset..."
                                        className="w-full border border-gray-200 rounded-lg py-2.5 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="bg-primary text-white px-5 py-2.5 rounded-lg hover:bg-secondary transition flex items-center gap-2"
                                >
                                    <MaterialIcon name="search" className="text-lg" />
                                    Cari
                                </button>
                            </div>
                        </form>

                        {/* Bulk Actions Bar */}
                        {selectedIds.size > 0 && (
                            <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center justify-between">
                                <span className="text-sm font-medium text-primary">
                                    {selectedIds.size} dataset dipilih
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleBulkDelete(false)}
                                        disabled={bulkDeleting}
                                        className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <MaterialIcon name="delete" className="text-base" />
                                        Hapus
                                    </button>
                                    <button
                                        onClick={() => handleBulkDelete(true)}
                                        disabled={bulkDeleting}
                                        className="px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition flex items-center gap-1 disabled:opacity-50"
                                    >
                                        <MaterialIcon name="delete_forever" className="text-base" />
                                        Hapus Permanen
                                    </button>
                                    <button
                                        onClick={() => setSelectedIds(new Set())}
                                        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        Batal
                                    </button>
                                </div>
                            </div>
                        )}

                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                            </div>
                        ) : error ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 flex items-center gap-2">
                                <MaterialIcon name="error" />
                                {error}
                            </div>
                        ) : datasets.length === 0 ? (
                            <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-12 text-center">
                                <MaterialIcon name="inventory_2" className="text-6xl text-gray-300 mb-4" />
                                <p className="text-muted">Tidak ada dataset ditemukan.</p>
                            </div>
                        ) : (
                            <div className="bg-white shadow-sm rounded-xl border border-border overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-100">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="w-12 px-4 py-2.5 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                                    onChange={toggleSelectAll}
                                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                                                />
                                            </th>
                                            <th
                                                className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition select-none"
                                                onClick={() => handleSort('title')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Dataset
                                                    <SortIcon field="title" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition select-none"
                                                onClick={() => handleSort('organization')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Organisasi
                                                    <SortIcon field="organization" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition select-none"
                                                onClick={() => handleSort('private')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Status
                                                    <SortIcon field="private" />
                                                </div>
                                            </th>
                                            <th
                                                className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition select-none"
                                                onClick={() => handleSort('metadata_modified')}
                                            >
                                                <div className="flex items-center gap-1">
                                                    Dimodifikasi
                                                    <SortIcon field="metadata_modified" />
                                                </div>
                                            </th>
                                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Aksi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {sortedDatasets.map((dataset) => (
                                            <tr
                                                key={dataset.id}
                                                className={`hover:bg-gray-50 transition-colors ${selectedIds.has(dataset.id) ? 'bg-primary/5' : ''}`}
                                            >
                                                <td className="w-12 px-4 py-2.5 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(dataset.id)}
                                                        onChange={() => toggleSelect(dataset.id)}
                                                        className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <Link href={`/${dataset.name}`} className="group">
                                                        <div className="text-sm font-medium text-gray-900 group-hover:text-primary transition-colors">{dataset.title}</div>
                                                        <div className="text-xs text-gray-400">{dataset.num_resources || 0} resource</div>
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-2.5 text-sm text-gray-500">
                                                    {dataset.organization?.title || '-'}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    {dataset.private ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                                                            <MaterialIcon name="lock" className="text-xs" />
                                                            Private
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                                                            <MaterialIcon name="public" className="text-xs" />
                                                            Public
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5 text-sm text-gray-500">
                                                    {new Date(dataset.metadata_modified + 'Z').toLocaleDateString('id-ID')}
                                                </td>
                                                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleDelete(dataset.id, dataset.title, false)}
                                                        className="text-amber-500 hover:text-amber-700 hover:bg-amber-50 p-1.5 rounded transition-colors inline-flex"
                                                        title="Hapus"
                                                    >
                                                        <MaterialIcon name="delete" className="text-lg" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(dataset.id, dataset.title, true)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded transition-colors inline-flex"
                                                        title="Hapus Permanen"
                                                    >
                                                        <MaterialIcon name="delete_forever" className="text-lg" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
