import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import Link from 'next/link';




interface Activity {
    id: string;
    timestamp: string;
    activity_type: string;
    user_id: string;
    username?: string;
    object_id: string;
    data?: {
        package?: {
            title: string;
        };
    };
}

interface Dataset {
    id: string;
    name: string;
    title: string;
    notes?: string;
    metadata_modified: string;
    num_resources?: number;
}

interface Organization {
    id: string;
    name: string;
    title: string;
    description?: string;
    image_url?: string;
    package_count?: number;
}

interface Group {
    id: string;
    name: string;
    title: string;
    description?: string;
    package_count?: number;
}

export default function Profile() {
    const router = useRouter();
    const { isAuthenticated, isLoading, getApiKey, requireAuth, updateUser } = useAuth();
    const [activeTab, setActiveTab] = useState<'activity' | 'datasets' | 'organizations' | 'groups' | 'settings'>('activity');

    const [activities, setActivities] = useState<Activity[]>([]);
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);

    const [loadingActivities, setLoadingActivities] = useState(false);
    const [loadingDatasets, setLoadingDatasets] = useState(false);
    const [loadingOrgs, setLoadingOrgs] = useState(false);
    const [loadingGroups, setLoadingGroups] = useState(false);

    const [activitiesFetched, setActivitiesFetched] = useState(false);
    const [datasetsFetched, setDatasetsFetched] = useState(false);
    const [orgsFetched, setOrgsFetched] = useState(false);
    const [groupsFetched, setGroupsFetched] = useState(false);
    const [profileFetched, setProfileFetched] = useState(false);
    const [visibleActivitiesCount, setVisibleActivitiesCount] = useState(5);

    // Display Profile State
    const [userProfile, setUserProfile] = useState<{ fullname: string; email: string; about: string; name: string } | null>(null);

    // Profile Form State
    const [fullname, setFullname] = useState('');
    const [email, setEmail] = useState('');
    const [about, setAbout] = useState('');
    const [username, setUsername] = useState('');
    const [updatingProfile, setUpdatingProfile] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

    useEffect(() => {
        requireAuth();
    }, []);

    useEffect(() => {
        if (!isAuthenticated()) return;

        // Always fetch profile on mount to show in header
        // Try to load from local storage first for immediate display
        const userStr = localStorage.getItem('portal_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (!userProfile) {
                setUserProfile({
                    fullname: user.fullname || '',
                    email: user.email || '',
                    about: user.about || '',
                    name: user.name || ''
                });
            }
        }

        if (!profileFetched) fetchUserProfile();

        // Pre-fetch data for counts
        if (!datasetsFetched) fetchDatasets();
        if (!orgsFetched) fetchOrganizations();

        if (activeTab === 'activity' && !activitiesFetched) fetchActivities();
        else if (activeTab === 'groups' && !groupsFetched) fetchGroups();
    }, [activeTab, isAuthenticated]); // Added isAuthenticated to dependencies

    const fetchActivities = async () => {
        setLoadingActivities(true);
        try {
            const response = await axios.get('/api/profile', {
                params: { action: 'activities' },
                headers: { Authorization: getApiKey() }
            });
            setActivities(response.data.result);
            setActivitiesFetched(true);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoadingActivities(false);
        }
    };

    const fetchDatasets = async () => {
        setLoadingDatasets(true);
        try {
            const userStr = localStorage.getItem('portal_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                const response = await axios.get('/api/profile', {
                    params: { action: 'datasets', userId: user.id },
                    headers: { Authorization: getApiKey() }
                });
                setDatasets(response.data.result);
                setDatasetsFetched(true);
            }
        } catch (error) {
            console.error('Error fetching datasets:', error);
        } finally {
            setLoadingDatasets(false);
        }
    };

    const fetchOrganizations = async () => {
        setLoadingOrgs(true);
        try {
            const response = await axios.get('/api/profile', {
                params: { action: 'organizations' },
                headers: { Authorization: getApiKey() }
            });
            setOrganizations(response.data.result);
            setOrgsFetched(true);
        } catch (error) {
            console.error('Error fetching organizations:', error);
        } finally {
            setLoadingOrgs(false);
        }
    };

    const fetchGroups = async () => {
        setLoadingGroups(true);
        try {
            const response = await axios.get('/api/profile', {
                params: { action: 'groups' },
                headers: { Authorization: getApiKey() }
            });
            setGroups(response.data.result);
            setGroupsFetched(true);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoadingGroups(false);
        }
    };

    const fetchUserProfile = async () => {
        try {
            const userStr = localStorage.getItem('portal_user');
            if (userStr) {
                const user = JSON.parse(userStr);
                // Fetch fresh data
                const response = await axios.get('/api/profile', {
                    params: { action: 'user', userId: user.id },
                    headers: { Authorization: getApiKey() }
                });
                const userData = response.data.result;
                const profileData = {
                    fullname: userData.fullname || '',
                    email: userData.email || '',
                    about: userData.about || '',
                    name: userData.name || ''
                };

                setUserProfile(profileData);

                // Set form state
                setFullname(profileData.fullname);
                setEmail(profileData.email);
                setAbout(profileData.about);
                setUsername(profileData.name);

                setProfileFetched(true);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setUpdatingProfile(true);
        setUpdateMessage('');

        try {
            const userStr = localStorage.getItem('portal_user');
            const user = userStr ? JSON.parse(userStr) : null;

            await axios.post('/api/profile/update', {
                userId: user?.id,
                fullname: fullname,
                email: email,
                about: about
            }, {
                headers: { Authorization: getApiKey() }
            });

            setUpdateMessage('Profil berhasil diperbarui!');
            fetchUserProfile(); // Re-fetch profile to update local storage and display
        } catch (error: any) {
            console.error('Error updating profile:', error);
            setUpdateMessage('Gagal memperbarui profil: ' + (error.response?.data?.error?.message || error.message));
        } finally {
            setUpdatingProfile(false);
        }
    };

    const getActivityIcon = (type: string) => {
        if (type.includes('new package')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
            );
        }
        if (type.includes('changed package')) {
            return (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            );
        }
        return (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        );
    };

    const getRelativeTime = (timestamp: string) => {
        // CKAN returns timestamps in UTC without 'Z' suffix
        // Add 'Z' to ensure it's parsed as UTC
        const utcTimestamp = timestamp.endsWith('Z') ? timestamp : timestamp + 'Z';
        const date = new Date(utcTimestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit yang lalu`;
        if (diffHours < 24) return `${diffHours} jam yang lalu`;
        if (diffDays < 30) return `${diffDays} hari yang lalu`;
        return date.toLocaleDateString('id-ID');
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-muted">Loading...</div>
                </div>
            </Layout>
        );
    }

    if (!isAuthenticated()) {
        return null;
    }

    return (
        <Layout title="Profil Saya - Portal Data Nusantara">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
                {/* Left Sidebar - Profile Card */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="bg-white rounded-xl shadow-sm border border-border p-6 sticky top-24">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center text-primary text-5xl font-bold mb-4">
                                {userProfile?.fullname ? userProfile.fullname.charAt(0).toUpperCase() : (userProfile?.email ? userProfile.email.charAt(0).toUpperCase() : '?')}
                            </div>
                            <h2 className="text-xl font-bold text-text mb-1">{userProfile?.fullname || 'Tanpa Nama'}</h2>
                            <p className="text-sm text-muted mb-4">{userProfile?.email}</p>

                            {userProfile?.about && (
                                <div className="w-full pt-4 border-t border-gray-100 mt-2">
                                    <p className="text-sm text-gray-600 italic">"{userProfile.about}"</p>
                                </div>
                            )}

                            <div className="w-full pt-4 mt-4 border-t border-gray-100 grid grid-cols-2 gap-4 text-center">
                                <div>
                                    <span className="block text-lg font-bold text-primary">{datasets.length}</span>
                                    <span className="text-xs text-muted uppercase tracking-wider">Dataset</span>
                                </div>
                                <div>
                                    <span className="block text-lg font-bold text-primary">{organizations.length}</span>
                                    <span className="text-xs text-muted uppercase tracking-wider">Organisasi</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Content - Tabs & Data */}
                <div className="lg:col-span-8 xl:col-span-9">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-text">
                            Dashboard <span className="text-primary">Profil</span>
                        </h1>
                        <p className="text-muted">Kelola aktivitas dan data Anda</p>
                    </div>

                    {/* Tabs */}
                    <div className="bg-white rounded-lg shadow-sm border border-border mb-6">
                        <div className="flex overflow-x-auto scrollbar-hide">
                            <button
                                onClick={() => setActiveTab('activity')}
                                className={`flex-1 min-w-[120px] px-4 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors text-center ${activeTab === 'activity'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted hover:text-text hover:border-gray-300'
                                    }`}
                            >
                                Aktivitas
                            </button>
                            <button
                                onClick={() => setActiveTab('datasets')}
                                className={`flex-1 min-w-[120px] px-4 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors text-center ${activeTab === 'datasets'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted hover:text-text hover:border-gray-300'
                                    }`}
                            >
                                Dataset Saya
                            </button>
                            <button
                                onClick={() => setActiveTab('organizations')}
                                className={`flex-1 min-w-[120px] px-4 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors text-center ${activeTab === 'organizations'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted hover:text-text hover:border-gray-300'
                                    }`}
                            >
                                Organisasi
                            </button>
                            <button
                                onClick={() => setActiveTab('groups')}
                                className={`flex-1 min-w-[120px] px-4 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors text-center ${activeTab === 'groups'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted hover:text-text hover:border-gray-300'
                                    }`}
                            >
                                Grup
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`flex-1 min-w-[120px] px-4 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors text-center ${activeTab === 'settings'
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted hover:text-text hover:border-gray-300'
                                    }`}
                            >
                                Pengaturan
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="animate-fadeIn">
                        {/* Activity Tab */}
                        {activeTab === 'activity' && (
                            <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                                <h2 className="text-lg font-bold text-text mb-4">Aktivitas Terbaru</h2>
                                {loadingActivities ? (
                                    <div className="space-y-4">
                                        {[...Array(5)].map((_, i) => (
                                            <div key={i} className="animate-pulse flex gap-4">
                                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                                <div className="flex-1 space-y-2">
                                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : activities.length > 0 ? (
                                    <div className="space-y-4">
                                        {activities.slice(0, visibleActivitiesCount).map((activity) => (
                                            <div key={activity.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                                                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                                                    {getActivityIcon(activity.activity_type)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm text-text">
                                                        <span className="font-semibold">{activity.username || activity.user_id}</span>
                                                        {' '}
                                                        {activity.activity_type.replace(/_/g, ' ').replace(/package/gi, 'dataset').replace(/new dataset/, 'created dataset').replace(/changed dataset/, 'updated dataset')}
                                                        {activity.data?.package?.title && (
                                                            <>
                                                                {' '}
                                                                <span className="font-medium">{activity.data.package.title}</span>
                                                            </>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-muted mt-1">{getRelativeTime(activity.timestamp)}</p>
                                                </div>
                                            </div>
                                        ))}

                                        {activities.length > visibleActivitiesCount && (
                                            <div className="pt-2 text-center">
                                                <button
                                                    onClick={() => setVisibleActivitiesCount(prev => prev + 5)}
                                                    className="text-sm text-primary hover:text-secondary font-medium transition-colors"
                                                >
                                                    Lihat Selengkapnya
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-muted">Belum ada aktivitas</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Datasets Tab */}
                        {activeTab === 'datasets' && (
                            <div className="space-y-4">
                                {loadingDatasets ? (
                                    [...Array(3)].map((_, i) => (
                                        <div key={i} className="animate-pulse bg-white rounded-lg border border-border p-6">
                                            <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                                            <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                        </div>
                                    ))
                                ) : datasets.length > 0 ? (
                                    datasets.map((dataset) => (
                                        <Link key={dataset.id} href={`/${dataset.name}`}>
                                            <div className="bg-white rounded-lg border border-border p-6 hover:shadow-md hover:border-primary transition-all cursor-pointer">
                                                <h3 className="text-lg font-bold text-text hover:text-primary mb-2">{dataset.title}</h3>
                                                <p className="text-sm text-muted mb-3 line-clamp-2">{dataset.notes || 'Tidak ada deskripsi'}</p>
                                                <div className="flex items-center gap-4 text-xs text-muted">
                                                    <span className="flex items-center">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        {dataset.num_resources || 0} file
                                                    </span>
                                                    <span>Diperbarui {new Date(dataset.metadata_modified).toLocaleDateString('id-ID')}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
                                        <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-text mb-2">Belum ada dataset</h3>
                                        <p className="text-muted mb-4">Mulai dengan membuat dataset pertama Anda</p>
                                        <Link href="/upload" className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors">
                                            Buat Dataset
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Organizations Tab */}
                        {activeTab === 'organizations' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {loadingOrgs ? (
                                    [...Array(4)].map((_, i) => (
                                        <div key={i} className="animate-pulse bg-white rounded-lg border border-border p-6">
                                            <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
                                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                                        </div>
                                    ))
                                ) : organizations.length > 0 ? (
                                    organizations.map((org) => (
                                        <div key={org.id} className="bg-white rounded-lg border border-border p-6 hover:shadow-md hover:border-primary transition-all">
                                            <div className="flex items-center gap-4 mb-3">
                                                {org.image_url ? (
                                                    <img src={org.image_url} alt={org.title} className="w-12 h-12 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                                        {org.title.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="text-lg font-bold text-text">{org.title}</h3>
                                                    <p className="text-xs text-muted">{org.package_count || 0} dataset</p>
                                                </div>
                                            </div>
                                            {org.description && (
                                                <p className="text-sm text-muted line-clamp-2">{org.description}</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
                                        <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-text mb-2">Belum ada organisasi</h3>
                                        <p className="text-muted">Anda belum terdaftar di organisasi manapun</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Groups Tab */}
                        {activeTab === 'groups' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {loadingGroups ? (
                                    [...Array(4)].map((_, i) => (
                                        <div key={i} className="animate-pulse bg-white rounded-lg border border-border p-6">
                                            <div className="h-6 bg-gray-200 rounded w-1/2 mb-3"></div>
                                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                                        </div>
                                    ))
                                ) : groups.length > 0 ? (
                                    groups.map((group) => (
                                        <div key={group.id} className="bg-white rounded-lg border border-border p-6 hover:shadow-md hover:border-primary transition-all">
                                            <h3 className="text-lg font-bold text-text mb-2">{group.title}</h3>
                                            <p className="text-xs text-muted mb-3">{group.package_count || 0} dataset</p>
                                            {group.description && (
                                                <p className="text-sm text-muted line-clamp-2">{group.description}</p>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="col-span-2 bg-white rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
                                        <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                        <h3 className="text-lg font-medium text-text mb-2">Belum ada grup</h3>
                                        <p className="text-muted">Anda belum tergabung dalam grup manapun</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Settings Tab */}
                        {activeTab === 'settings' && (
                            <div className="bg-white rounded-lg shadow-sm border border-border p-6">
                                <h2 className="text-xl font-bold text-text mb-6">Edit Profil</h2>

                                {updateMessage && (
                                    <div className={`p-4 rounded-md mb-6 ${updateMessage.includes('Gagal') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                                        {updateMessage}
                                    </div>
                                )}

                                <form onSubmit={handleUpdateProfile} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-text mb-1">
                                            Username
                                        </label>
                                        <input
                                            type="text"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border bg-gray-50"
                                            value={username}
                                            onChange={(e) => setUsername(e.target.value)}
                                            placeholder="username"
                                            disabled
                                        />
                                        <p className="mt-1 text-xs text-muted">Username tidak dapat diubah setelah akun dibuat.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text mb-1">
                                            Nama Lengkap
                                        </label>
                                        <input
                                            type="text"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                            value={fullname}
                                            onChange={(e) => setFullname(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text mb-1">
                                            Email
                                        </label>
                                        <input
                                            type="email"
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border bg-gray-50"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            disabled // Often email change requires verification or is restricted
                                        />
                                        <p className="mt-1 text-xs text-muted">Email tidak dapat diubah secara langsung.</p>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-text mb-1">
                                            Tentang Saya (Bio)
                                        </label>
                                        <textarea
                                            rows={4}
                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                            value={about}
                                            onChange={(e) => setAbout(e.target.value)}
                                            placeholder="Ceritakan sedikit tentang diri Anda..."
                                        />
                                    </div>

                                    <div className="pt-4 border-t">
                                        <button
                                            type="submit"
                                            disabled={updatingProfile}
                                            className="px-6 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors font-medium disabled:opacity-50"
                                        >
                                            {updatingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
