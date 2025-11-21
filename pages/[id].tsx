import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import axios from 'axios';
import Layout from '@/components/Layout';
import ResourceCard from '@/components/ResourceCard';
import FileViewer from '@/components/FileViewer';
import Head from 'next/head';
import { useAuth } from '@/hooks/useAuth';

import { getCkanUrl } from '@/lib/ckan';

// const CKAN_API = 'http://localhost:5001/api/3';

interface Resource {
    id: string;
    name: string;
    format: string;
    url: string;
    description?: string;
    created?: string;
    size?: number;
}

interface Organization {
    id: string;
    title: string;
    image_url?: string;
    description?: string;
    name: string;
}

interface Dataset {
    id: string;
    name: string;
    title: string;
    notes?: string;
    num_resources?: number;
    metadata_modified?: string;
    metadata_created?: string;
    license_title?: string;
    author?: string;
    author_email?: string;
    maintainer?: string;
    maintainer_email?: string;
    private?: boolean;
    organization?: Organization;
    tags?: { name: string }[];
    resources: Resource[];
    groups?: { title: string }[];
}

interface Activity {
    id: string;
    timestamp: string;
    activity_type: string;
    user_id: string;
    object_id: string;
    data: {
        package?: { title: string };
        user?: { name: string };
    };
    username?: string; // Added username field
}

export default function DatasetDetail() {
    const router = useRouter();
    const { id } = router.query;
    const { getApiKey, user, isLoading: authLoading, apiKey, isSysadmin } = useAuth();
    const [dataset, setDataset] = useState<Dataset | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'data' | 'metadata' | 'activity'>('data');
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [userOrgs, setUserOrgs] = useState<string[]>([]);
    const [viewingResource, setViewingResource] = useState<Resource | null>(null);

    useEffect(() => {
        if (id && !authLoading) {
            fetchDataset();
            fetchActivities();
            if (user) {
                fetchUserOrgs();
            }
        }
    }, [id, authLoading, apiKey, user]);

    const fetchUserOrgs = async () => {
        try {
            const key = getApiKey();
            if (!key) return;

            const base = getCkanUrl();
            const response = await axios.get(`${base}/api/3/action/organization_list_for_user`, {
                headers: { Authorization: key }
            });

            if (response.data.success) {
                const orgs = response.data.result.map((org: any) => org.name);
                setUserOrgs(orgs);
            }
        } catch (error) {
            console.error('Error fetching user organizations:', error);
        }
    };

    const fetchDataset = async () => {
        try {
            const headers: any = {};
            const key = getApiKey();
            if (key) headers.Authorization = key;

            // Use proxy API to fetch dataset details (handles private datasets)
            const response = await axios.get(`/api/dataset?id=${id}`, { headers });

            if (response.data.success) {
                setDataset(response.data.result);
            }
        } catch (error: any) {
            console.error('Error fetching dataset:', error);
            // If 403/401 (unauthorized) or 404 (not found/private), redirect to login if not authenticated
            if (!user && (error.response?.status === 403 || error.response?.status === 401 || error.response?.status === 404)) {
                router.push(`/login?redirect=/dataset/${id}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
            const headers: any = {};
            const key = getApiKey();
            if (key) headers.Authorization = key;

            // Use proxy API to fetch activities (handles private datasets)
            const response = await axios.get(`/api/activity?id=${id}`, { headers });

            if (response.data.success) {
                const activitiesData = response.data.result;

                // Extract unique user IDs
                const userIds = [...new Set(activitiesData.map((a: Activity) => a.user_id))];

                // Batch fetch all users via proxy
                const usersRes = await axios.get('/api/profile', {
                    params: { action: 'users', userId: userIds.join(',') },
                    headers
                });

                // Create a map of user IDs to usernames
                const usersMap = new Map(
                    usersRes.data.result.map((u: any) => [u.id, u.user?.name || 'Unknown User'])
                );

                // Map usernames to activities
                const activitiesWithUsernames = activitiesData.map((activity: Activity) => ({
                    ...activity,
                    username: usersMap.get(activity.user_id) || 'Unknown User'
                }));

                setActivities(activitiesWithUsernames);
            }
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoadingActivities(false);
        }
    };

    const getRelativeTime = (timestamp: string) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 30) return `${diffDays} hari yang lalu`;
        return date.toLocaleDateString('id-ID');
    };

    const handleDelete = async () => {
        if (!confirm('Apakah Anda yakin ingin menghapus dataset ini? Tindakan ini tidak dapat dibatalkan.')) {
            return;
        }

        setDeleting(true);
        try {
            await axios.post(
                `${getCkanUrl()}/api/3/action/package_delete`,
                { id: dataset?.id },
                { headers: { 'Content-Type': 'application/json', Authorization: getApiKey() } }
            );
            alert('Dataset berhasil dihapus!');
            router.push('/search');
        } catch (error) {
            console.error('Error deleting dataset:', error);
            alert('Gagal menghapus dataset. Pastikan Anda memiliki izin untuk menghapus dataset ini.');
        } finally {
            setDeleting(false);
        }
    };

    // Check if user has access to resources
    const hasAccess = !dataset?.private || (dataset?.organization && userOrgs.includes(dataset.organization.name)) || isSysadmin;

    if (loading) return (
        <Layout>
            <div className="animate-pulse space-y-8">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-64 bg-gray-200 rounded"></div>
                    </div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        </Layout>
    );

    if (!dataset) return (
        <Layout>
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-text">Dataset tidak ditemukan</h3>
            </div>
        </Layout>
    );

    return (
        <Layout title={`${dataset.title} - Portal Data Nusantara`}>
            <Head>
                <title>{dataset.title} - Portal Data Nusantara</title>
            </Head>

            {/* Back Button */}
            <button
                onClick={() => router.back()}
                className="inline-flex items-center text-primary hover:text-secondary mb-4 font-medium transition-colors"
            >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
            </button>

            {/* Breadcrumb */}
            <div className="text-sm text-muted mb-2">
                <span className="text-primary font-semibold">{dataset.organization?.title || 'UMUM'}</span>
                <span className="mx-2">•</span>
                <span>Diperbarui {dataset.metadata_modified ? new Date(dataset.metadata_modified).toLocaleDateString('id-ID') : 'N/A'}</span>
            </div>

            {/* Title */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-3">
                    <h1 className="text-4xl font-bold text-text">
                        {dataset.title}
                    </h1>
                    {dataset.private && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            Private
                        </span>
                    )}
                </div>
                {isSysadmin && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => router.push(`/dataset/${dataset.name}/edit`)}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                        </button>
                        <button
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            {deleting ? 'Menghapus...' : 'Hapus Dataset'}
                        </button>
                    </div>
                )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Description */}
                    <section className="bg-white rounded-lg shadow-sm border border-border p-6">
                        <h2 className="text-xl font-bold text-text mb-4">Deskripsi</h2>
                        <div className="prose max-w-none text-muted">
                            <p>{dataset.notes || 'Tidak ada deskripsi.'}</p>
                        </div>
                    </section>

                    {/* Resources */}
                    <section>
                        <h2 className="text-xl font-bold text-text mb-4">File & Resources ({dataset.resources.length})</h2>
                        <div className="space-y-4">
                            {dataset.resources.map((resource) => (
                                <div key={resource.id} className="bg-white rounded-lg shadow-sm border border-border p-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-text mb-1">{resource.name}</h3>
                                            <div className="flex items-center gap-4 text-sm text-muted">
                                                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-orange-600 text-white uppercase">
                                                    {resource.format || 'DATA'}
                                                </span>
                                                {resource.size && (
                                                    <span>{(resource.size / 1024).toFixed(2)} KB</span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {hasAccess ? (
                                                <>
                                                    <button
                                                        onClick={() => setViewingResource(resource)}
                                                        className="px-4 py-2 text-sm font-medium text-primary hover:text-white hover:bg-primary border border-primary rounded-md transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                        </svg>
                                                        View
                                                    </button>
                                                    <a
                                                        href={resource.url}
                                                        download
                                                        className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-secondary rounded-md transition-colors"
                                                    >
                                                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                        </svg>
                                                        Download
                                                    </a>
                                                </>
                                            ) : (
                                                <div className="flex items-center text-sm text-muted italic bg-gray-50 px-3 py-1 rounded border border-gray-200">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                    Akses Terbatas
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Activity Stream */}
                    <section className="bg-white rounded-lg shadow-sm border border-border p-6">
                        <h2 className="text-xl font-bold text-text mb-4 flex items-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Aktivitas Dataset
                        </h2>
                        {loadingActivities ? (
                            <div className="space-y-3">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="animate-pulse flex gap-3">
                                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : activities.length > 0 ? (
                            <div className="space-y-3">
                                {activities.map((activity) => (
                                    <div key={activity.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-text">
                                                <span className="font-semibold">{activity.username || activity.user_id}</span>
                                                {' '}
                                                {activity.activity_type.replace(/_/g, ' ').replace(/package/gi, 'dataset').replace(/new dataset/, 'created dataset').replace(/changed dataset/, 'updated dataset')}
                                                {' '}
                                                <span className="font-medium">{dataset.title}</span>
                                            </p>
                                            <p className="text-xs text-muted">{getRelativeTime(activity.timestamp)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <svg className="mx-auto h-10 w-10 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-muted">Belum ada aktivitas</p>
                            </div>
                        )}
                    </section>
                </div>

                {/* Sidebar Metadata */}
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                        <h3 className="text-lg font-bold text-text mb-4">Informasi Tambahan</h3>
                        <dl className="space-y-4">
                            <div>
                                <dt className="text-sm font-medium text-muted">Organisasi</dt>
                                <dd className="mt-1 text-sm text-text font-semibold">{dataset.organization?.title || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted">Penulis</dt>
                                <dd className="mt-1 text-sm text-text">{dataset.author || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted">Email Penulis</dt>
                                <dd className="mt-1 text-sm text-text">{dataset.author_email || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted">Maintainer</dt>
                                <dd className="mt-1 text-sm text-text">{dataset.maintainer || '-'}</dd>
                            </div>
                            <div>
                                <dt className="text-sm font-medium text-muted">Lisensi</dt>
                                <dd className="mt-1 text-sm text-text">{dataset.license_title || '-'}</dd>
                            </div>
                        </dl>
                    </div>

                    <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                        <h3 className="text-lg font-bold text-text mb-4">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                            {dataset.tags?.map((tag) => (
                                <span key={tag.name} className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                                    {tag.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* File Viewer Modal */}
            {viewingResource && (
                <FileViewer
                    resourceUrl={viewingResource.url}
                    fileName={viewingResource.name}
                    format={viewingResource.format}
                    onClose={() => setViewingResource(null)}
                    apiKey={getApiKey()}
                />
            )}
        </Layout>
    );
}
