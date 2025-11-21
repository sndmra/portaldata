import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useAuth } from '@/hooks/useAuth';
import { getCkanUrl } from '@/lib/ckan';

// const CKAN_API = 'http://localhost:5001/api/3';

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

export default function Upload() {
    const router = useRouter();
    const { apiKey, isLoading, requireAuth, logout } = useAuth();

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

    // Resource fields
    const [files, setFiles] = useState<{ file: File; name: string; description: string }[]>([]);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [currentName, setCurrentName] = useState('');
    const [currentDescription, setCurrentDescription] = useState('');

    // UI state
    const [organizations, setOrganizations] = useState<Organization[]>([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [uploadType, setUploadType] = useState<'document' | 'geospatial' | null>(null);

    useEffect(() => {
        requireAuth('/login');
    }, [isLoading]);

    useEffect(() => {
        // Fetch organizations
        const fetchOrganizations = async () => {
            try {
                const response = await axios.get('/api/organizations', {
                    headers: { Authorization: apiKey }
                });
                setOrganizations(response.data.result);
            } catch (error) {
                console.error('Error fetching organizations:', error);
            }
        };

        if (apiKey) {
            fetchOrganizations();
        }
    }, [apiKey]);

    // Auto-generate name from title
    useEffect(() => {
        const generatedName = title
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
        setName(generatedName);
    }, [title]);

    // Auto-set resource name from file
    useEffect(() => {
        if (currentFile && !currentName) {
            setCurrentName(currentFile.name);
        }
    }, [currentFile]);

    const addFile = () => {
        if (currentFile) {
            setFiles([...files, { file: currentFile, name: currentName || currentFile.name, description: currentDescription }]);
            setCurrentFile(null);
            setCurrentName('');
            setCurrentDescription('');
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Prepare tags array
            const tagsArray = tags
                .split(',')
                .map((tag) => ({ name: tag.trim() }))
                .filter((tag) => tag.name);

            // 1. Create Dataset
            const packageData: any = {
                name,
                title,
                notes: description,
                private: isPrivate,
                license_id: license,
                tags: tagsArray,
            };

            if (organization) packageData.owner_org = organization;
            if (author) packageData.author = author;
            if (authorEmail) packageData.author_email = authorEmail;
            if (maintainer) packageData.maintainer = maintainer;
            if (maintainerEmail) packageData.maintainer_email = maintainerEmail;

            // Use proxy API for dataset creation
            const packageRes = await axios.post(
                '/api/dataset/create',
                packageData,
                {
                    headers: { Authorization: apiKey },
                }
            );

            const packageId = packageRes.data.result.id;
            console.log('Dataset created with ID:', packageId);

            // 2. Upload Resources
            // Combine files list with currentFile if it exists
            const filesToUpload = [...files];
            if (currentFile) {
                filesToUpload.push({
                    file: currentFile,
                    name: currentName || currentFile.name,
                    description: currentDescription
                });
            }

            console.log('Starting resource upload loop. Files count:', filesToUpload.length);

            for (const [index, resource] of filesToUpload.entries()) {
                console.log(`Uploading file ${index + 1}/${filesToUpload.length}:`, resource.name);

                const formData = new FormData();
                formData.append('package_id', packageId);
                formData.append('upload', resource.file);
                formData.append('name', resource.name);
                formData.append('description', resource.description);
                formData.append('format', resource.file.name.split('.').pop()?.toUpperCase() || 'DATA');

                try {
                    // Use proxy API for resource creation
                    // IMPORTANT: Do NOT set Content-Type to multipart/form-data manually
                    // Let the browser/axios set it with the correct boundary
                    await axios.post('/api/resource/create', formData, {
                        headers: {
                            Authorization: apiKey,
                        },
                    });
                    console.log(`File ${index + 1} uploaded successfully`);
                } catch (uploadError) {
                    console.error(`Error uploading file ${index + 1}:`, uploadError);
                    throw uploadError; // Re-throw to catch in main block
                }
            }

            setMessage('Dataset berhasil dibuat!');
            setTimeout(() => router.push(`/${packageId}`), 1500);
        } catch (error: any) {
            console.error('Upload process error:', error);
            const errorMsg = error.response?.data?.error?.message || 'Gagal membuat dataset. Periksa koneksi dan coba lagi.';
            setMessage(`Gagal: ${errorMsg}`);
        } finally {
            setLoading(false);
        }
    };

    if (isLoading) {
        return (
            <Layout title="Upload Dataset - Portal Data Nusantara">
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-muted">Loading...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout title="Upload Dataset - Portal Data Nusantara">
            <div className="max-w-4xl mx-auto px-4 py-12 animate-fadeIn">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-text mb-2">Upload Dataset</h1>
                    <p className="text-lg text-muted">
                        Publikasikan data Anda ke Portal Data Nusantara.
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
                    <div className="px-6 py-4 border-b border-border bg-gray-50 flex justify-between items-center">
                        <div>
                            <h1 className="text-xl font-bold text-text">
                                {uploadType ? `Upload Dataset ${uploadType === 'document' ? 'Dokumen' : 'Geospatial'}` : 'Upload Dataset Baru'}
                            </h1>
                            <p className="mt-1 text-sm text-muted">
                                {uploadType
                                    ? 'Isi formulir di bawah ini untuk mempublikasikan dataset Anda.'
                                    : 'Pilih jenis dataset yang ingin Anda upload.'}
                            </p>
                        </div>
                    </div>

                    {!uploadType ? (
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Document Card */}
                            <button
                                onClick={() => setUploadType('document')}
                                className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-all group text-center h-64"
                            >
                                <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-text mb-2">Dokumen</h3>
                                <p className="text-muted text-sm">
                                    Upload file dokumen standar seperti CSV, Excel, PDF, JSON, dan lainnya.
                                </p>
                            </button>

                            {/* Geospatial Card */}
                            <button
                                onClick={() => setUploadType('geospatial')}
                                className="flex flex-col items-center justify-center p-8 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group text-center h-64"
                            >
                                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-text mb-2">Geospatial</h3>
                                <p className="text-muted text-sm">
                                    Upload file data spasial dan peta seperti GeoJSON, GeoTIFF, KML, dan SHP.
                                </p>
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleUpload} className="p-6 space-y-6">
                            <div className="flex items-center mb-4">
                                <button
                                    type="button"
                                    onClick={() => setUploadType(null)}
                                    className="flex items-center text-sm text-muted hover:text-primary transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                    </svg>
                                    Kembali ke Pilihan
                                </button>
                            </div>
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
                                            URL unik untuk dataset ini (otomatis dihasilkan dari judul).
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

                            {/* Resource Upload */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-semibold text-text border-b pb-2">
                                    File Dataset
                                </h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-text mb-1">
                                            Upload File
                                        </label>

                                        {/* File List */}
                                        {files.length > 0 && (
                                            <div className="mb-4 space-y-2">
                                                {files.map((f, index) => (
                                                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                                                        <div className="flex items-center space-x-3 overflow-hidden">
                                                            <div className={`flex-shrink-0 w-8 h-8 rounded flex items-center justify-center text-white text-xs font-bold ${f.file.name.endsWith('.pdf') ? 'bg-red-500' :
                                                                f.file.name.endsWith('.xlsx') || f.file.name.endsWith('.xls') ? 'bg-green-500' :
                                                                    'bg-blue-500'
                                                                }`}>
                                                                {f.file.name.split('.').pop()?.toUpperCase() || 'FILE'}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium text-text truncate">{f.name}</p>
                                                                <p className="text-xs text-muted truncate">{f.file.name} ({Math.round(f.file.size / 1024)} KB)</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeFile(index)}
                                                            className="text-red-500 hover:text-red-700 p-1"
                                                            title="Hapus file"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Upload Area */}
                                        {!currentFile ? (
                                            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary transition-colors">
                                                <div className="space-y-1 text-center">
                                                    <svg
                                                        className="mx-auto h-12 w-12 text-gray-400"
                                                        stroke="currentColor"
                                                        fill="none"
                                                        viewBox="0 0 48 48"
                                                        aria-hidden="true"
                                                    >
                                                        <path
                                                            d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                            strokeWidth={2}
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                    <div className="flex text-sm text-gray-600">
                                                        <label
                                                            htmlFor="file-upload"
                                                            className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-secondary focus-within:outline-none"
                                                        >
                                                            <span>Upload file</span>
                                                            <input
                                                                id="file-upload"
                                                                name="file-upload"
                                                                type="file"
                                                                className="sr-only"
                                                                onChange={(e) => setCurrentFile(e.target.files?.[0] || null)}
                                                            />
                                                        </label>
                                                        <p className="pl-1">atau drag and drop</p>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        {uploadType === 'document'
                                                            ? 'CSV, XLS, PDF, JSON hingga 1GB'
                                                            : 'TIF, GEOJSON hingga 1GB'}
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium text-text">File Terpilih: {currentFile.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setCurrentFile(null)}
                                                        className="text-xs text-red-600 hover:text-red-800"
                                                    >
                                                        Batal
                                                    </button>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-text mb-1">
                                                        Nama Resource
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                                        placeholder="Nama file"
                                                        value={currentName}
                                                        onChange={(e) => setCurrentName(e.target.value)}
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-text mb-1">
                                                        Deskripsi Resource
                                                    </label>
                                                    <textarea
                                                        rows={2}
                                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm p-2.5 border"
                                                        placeholder="Jelaskan isi file ini..."
                                                        value={currentDescription}
                                                        onChange={(e) => setCurrentDescription(e.target.value)}
                                                    />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={addFile}
                                                    className="w-full py-2 bg-white border border-primary text-primary rounded-md hover:bg-blue-50 transition-colors font-medium text-sm"
                                                >
                                                    + Tambahkan File ke Daftar
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => router.push('/')}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-2 bg-primary text-white rounded-md hover:bg-secondary transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Mengunggah...' : 'Publikasikan Dataset'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </Layout>
    );
}
