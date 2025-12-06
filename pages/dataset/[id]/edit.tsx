import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';



interface Organization {
    id: string;
    name: string;
    title: string;
    display_name: string;
}

const LICENSES = [
    { id: 'cc-by', title: 'Creative Commons Attribution' },
    { id: 'cc-by-sa', title: 'Creative Commons Attribution Share-Alike' },
    { id: 'cc-zero', title: 'Creative Commons CCZero' },
    { id: 'cc-nc', title: 'Creative Commons Non-Commercial (Any)' },
    { id: 'odc-pddl', title: 'Open Data Commons Public Domain Dedication and License (PDDL)' },
    { id: 'odc-by', title: 'Open Data Commons Attribution License' },
    { id: 'other-open', title: 'Other (Open)' },
    { id: 'notspecified', title: 'License not specified' },
];

export default function EditDataset() {
    const router = useRouter();
    const { id } = router.query;
    const { apiKey, isLoading, requireAuth } = useAuth();

    // Dataset fields
    const [title, setTitle] = useState('');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [tags, setTags] = useState('');
    const [license, setLicense] = useState('notspecified');
    const [organization, setOrganization] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [author, setAuthor] = useState('');
    const [authorEmail, setAuthorEmail] = useState('');
    const [maintainer, setMaintainer] = useState('');
    const [maintainerEmail, setMaintainerEmail] = useState('');
    const [resources, setResources] = useState<any[]>([]);

    // UI state
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState('');

    useEffect(() => {
        requireAuth('/login');
    }, [isLoading]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id || !apiKey) return;

            try {
                // Fetch organizations
                const orgsRes = await axios.get('/api/organizations', {
                    headers: { Authorization: apiKey }
                });
                setOrganizations(orgsRes.data.result);

                // Fetch dataset details
                const datasetRes = await axios.get('/api/dataset', {
                    params: { id },
                    headers: { Authorization: apiKey }
                });

                const dataset = datasetRes.data.result;

                // Pre-fill form
                setTitle(dataset.title);
                setName(dataset.name);
                setDescription(dataset.notes || '');
                setTags(dataset.tags?.map((t: any) => t.name).join(', ') || '');
                setLicense(dataset.license_id || 'notspecified');
                setOrganization(dataset.owner_org || '');
                setIsPrivate(dataset.private);
                setAuthor(dataset.author || '');
                setAuthorEmail(dataset.author_email || '');
                setMaintainer(dataset.maintainer || '');
                setMaintainerEmail(dataset.maintainer_email || '');
                setResources(dataset.resources || []);

            } catch (error) {
                console.error('Error fetching data:', error);
                setMessage('Gagal memuat data dataset.');
            } finally {
                setFetching(false);
            }
        };

        fetchData();
    }, [id, apiKey]);

    // Auto-generate name from title (only if name is empty, though usually it won't be in edit mode)
    // In edit mode, we might want to allow changing the name (URL), but be careful as it breaks links.
    // Let's allow it but not auto-update from title to avoid accidental URL changes.

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Prepare tags array
            const tagsArray = tags
                .split(',')
                .map((tag) => ({ name: tag.trim() }))
                .filter((tag) => tag.name);

            const packageData: any = {
                id: id, // Important for update
                name,
                title,
                notes: description,
                private: isPrivate,
                license_id: license,
                tags: tagsArray,
                resources: resources, // Preserve existing resources
            };

            if (organization) packageData.owner_org = organization;
            if (author) packageData.author = author;
            if (authorEmail) packageData.author_email = authorEmail;
            if (maintainer) packageData.maintainer = maintainer;
            if (maintainerEmail) packageData.maintainer_email = maintainerEmail;

            await axios.post(
                '/api/dataset/update',
                packageData,
                {
                    headers: { Authorization: apiKey },
                }
            );

            setMessage('Dataset berhasil diperbarui!');
            setTimeout(() => router.push(`/${name}`), 1500); // Redirect to the new name (URL)
        } catch (error: any) {
            console.error(error);
            const errorMsg = error.response?.data?.error?.message || 'Gagal memperbarui dataset. Periksa koneksi dan coba lagi.';
            setMessage(`Gagal: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    if (isLoading || fetching) {
        return (
            <Layout title="Edit Dataset - Portal Data Nusantara">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-muted">Loading...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title={`Edit ${title} - Portal Data Nusantara`}>
            <div className="max-w-4xl mx-auto px-4 py-12 animate-fadeIn">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text mb-2">Edit Dataset</h1>
                    <p className="text-lg text-muted">
                        Perbarui informasi dataset Anda.
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
                    <form onSubmit={handleUpdate} className="p-6 space-y-6">
                        {message && (
                            <div
                                className={`p-4 rounded-md ${message.includes('Gagal')
                                    ? 'bg-red-50 text-red-700'
                                    : 'bg-green-50 text-green-700'
                                    }`}
                            >
                                {message}
                            </div>
                        )}

                        {/* Basic Information */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-text border-b pb-2">
                                Informasi Dasar
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Judul Dataset <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                        placeholder="Contoh: Data Penduduk 2024"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text mb-1">
                                        URL/Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border bg-gray-50"
                                        placeholder="data-penduduk-2024"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                    <p className="mt-1 text-xs text-muted">
                                        URL unik untuk dataset ini. Mengubah ini akan mengubah link dataset.
                                    </p>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Deskripsi
                                    </label>
                                    <textarea
                                        rows={4}
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                        placeholder="Jelaskan isi dataset ini..."
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Tag
                                    </label>
                                    <input
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                        placeholder="kesehatan, pendidikan, ekonomi (pisahkan dengan koma)"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                    />
                                    <p className="mt-1 text-xs text-muted">
                                        Pisahkan tag dengan koma.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Lisensi
                                    </label>
                                    <select
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                        value={license}
                                        onChange={(e) => setLicense(e.target.value)}
                                    >
                                        {LICENSES.map((lic) => (
                                            <option key={lic.id} value={lic.id}>
                                                {lic.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Organisasi
                                    </label>
                                    <select
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                        value={organization}
                                        onChange={(e) => setOrganization(e.target.value)}
                                    >
                                        <option value="">Tidak ada organisasi</option>
                                        {organizations.map((org) => (
                                            <option key={org.id} value={org.id}>
                                                {org.display_name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            className="rounded border-gray-300 text-primary shadow-sm focus:border-primary focus:ring-primary"
                                            checked={isPrivate}
                                            onChange={(e) => setIsPrivate(e.target.checked)}
                                        />
                                        <span className="ml-2 text-sm text-text">
                                            Dataset Privat (hanya dapat dilihat oleh anggota organisasi)
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold text-text border-b pb-2">
                                Informasi Kontak
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Author
                                    </label>
                                    <input
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                        placeholder="Nama penulis"
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Author Email
                                    </label>
                                    <input
                                        type="email"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                        placeholder="author@example.com"
                                        value={authorEmail}
                                        onChange={(e) => setAuthorEmail(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Maintainer
                                    </label>
                                    <input
                                        type="text"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                        placeholder="Nama pengelola"
                                        value={maintainer}
                                        onChange={(e) => setMaintainer(e.target.value)}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-text mb-1">
                                        Maintainer Email
                                    </label>
                                    <input
                                        type="email"
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                        placeholder="maintainer@example.com"
                                        value={maintainerEmail}
                                        onChange={(e) => setMaintainerEmail(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}
