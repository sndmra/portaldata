import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

// Helper function to get color for file format
const getFormatColor = (format: string): string => {
    const formatLower = format?.toLowerCase() || '';
    if (formatLower === 'pdf') return 'bg-red-600';
    if (formatLower === 'xlsx' || formatLower === 'xls') return 'bg-green-600';
    if (formatLower === 'csv') return 'bg-blue-600';
    if (formatLower === 'json') return 'bg-purple-600';
    if (formatLower === 'xml') return 'bg-yellow-600';
    if (formatLower === 'txt') return 'bg-gray-600';
    return 'bg-orange-600'; // default
};

interface Dataset {
    id: string;
    title: string;
    notes?: string;
    num_resources?: number;
    metadata_modified?: string;
    private?: boolean;
    organization?: {
        title: string;
        image_url?: string;
    };
    tags?: { name: string }[];
    resources?: { format: string }[];
}

interface Facet {
    name: string;
    display_name: string;
    count: number;
}

export default function Search() {
    const router = useRouter();
    const { q, org, tag, format } = router.query;
    const { getApiKey, isLoading: authLoading, apiKey } = useAuth();

    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [viewMode, setViewMode] = useState<'list' | 'grid' | 'compact'>('list');
    const [page, setPage] = useState(1);
    const ROWS_PER_PAGE = 10;

    // Filters
    const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [selectedFormats, setSelectedFormats] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Facets
    const [orgFacets, setOrgFacets] = useState<Facet[]>([]);
    const [tagFacets, setTagFacets] = useState<Facet[]>([]);
    const [formatFacets, setFormatFacets] = useState<Facet[]>([]);

    useEffect(() => {
        if (router.isReady && !authLoading) {
            if (q) setSearchQuery(q as string);
            if (org) setSelectedOrgs(Array.isArray(org) ? org : [org as string]);
            if (tag) setSelectedTags(Array.isArray(tag) ? tag : [tag as string]);
            if (format) setSelectedFormats(Array.isArray(format) ? format : [format as string]);
        }
    }, [router.isReady, q, org, tag, format, authLoading]);

    useEffect(() => {
        if (!authLoading) {
            fetchDatasets();
            fetchFacets();
        }
    }, [searchQuery, selectedOrgs, selectedTags, selectedFormats, apiKey, authLoading]);

    const fetchFacets = async () => {
        try {
            // We need to fetch facets separately or extract them from the main search
            // For now, let's just fetch all organizations and groups as a baseline
            // Ideally, CKAN package_search returns facets if requested

            // Using package_search to get facets
            // Use proxy API
            const response = await axios.get('/api/search', {
                params: {
                    q: searchQuery || undefined,
                    rows: 0, // We only want facets
                    'facet.field': '["organization", "tags", "res_format"]',
                    include_private: true
                },
                headers: apiKey ? { Authorization: apiKey } : {}
            });

            if (response.data.success) {
                const facets = response.data.result.search_facets;

                if (facets.organization) {
                    setOrgFacets(facets.organization.items);
                }
                if (facets.tags) {
                    setTagFacets(facets.tags.items);
                }
                if (facets.res_format) {
                    setFormatFacets(facets.res_format.items);
                }
            }
        } catch (error) {
            console.error('Error fetching facets:', error);
        }
    };

    const fetchDatasets = async () => {
        setLoading(true);
        try {
            const fqParts = [];
            if (selectedOrgs.length > 0) {
                fqParts.push(`organization:(${selectedOrgs.map(o => `"${o}"`).join(' OR ')})`);
            }
            if (selectedTags.length > 0) {
                fqParts.push(`tags:(${selectedTags.map(t => `"${t}"`).join(' OR ')})`);
            }
            if (selectedFormats.length > 0) {
                fqParts.push(`res_format:(${selectedFormats.map(f => `"${f}"`).join(' OR ')})`);
            }

            const params: any = {
                q: searchQuery || undefined,
                rows: 10,
                sort: 'metadata_modified desc',
                include_private: true
            };

            if (fqParts.length > 0) {
                params.fq = fqParts.join(' AND ');
            }

            const headers: any = {};
            if (apiKey) headers.Authorization = apiKey;

            // Use proxy API to ensure private datasets are visible to guests
            const response = await axios.get('/api/search', { params, headers });

            if (response.data.success) {
                setDatasets(response.data.result.results);
                setTotal(response.data.result.count);
            }
        } catch (error) {
            console.error('Error fetching datasets:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.push(`/search?q=${searchQuery}`);
    };

    const handlePageChange = (newPage: number) => {
        setPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const toggleFilter = (type: 'organization' | 'tag' | 'format', value: string) => {
        if (type === 'organization') {
            setSelectedOrgs(prev =>
                prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
            );
        } else if (type === 'tag') {
            setSelectedTags(prev =>
                prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
            );
        } else if (type === 'format') {
            setSelectedFormats(prev =>
                prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value]
            );
        }
        setPage(1); // Reset to first page on filter change
    };

    const totalPages = Math.ceil(total / ROWS_PER_PAGE);

    return (
        <Layout title="Jelajah Data - Portal Data Nusantara">
            {/* Page Header */}
            <div className="mb-8 animate-fadeIn">
                <h1 className="text-3xl font-bold text-text mb-2">
                    Jelajahi <span className="text-primary">Dataset</span>
                </h1>
                <p className="text-muted">
                    Temukan data yang Anda butuhkan dari {total} dataset tersedia
                </p>
            </div>

            {/* Search Bar */}
            <div className="mb-8 animate-fadeIn-delay-1">
                <form onSubmit={handleSearch} className="flex gap-3 max-w-3xl">
                    <div className="flex-1 relative">
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg px-4 py-3 pl-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                            placeholder="Cari dataset berdasarkan kata kunci..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <svg
                            className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <button
                        type="submit"
                        className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-secondary transition-colors shadow-sm font-medium"
                    >
                        Cari
                    </button>
                </form>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 animate-fadeIn-delay-2 items-start">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-64 flex-shrink-0">
                    <div className="lg:sticky lg:top-24 space-y-6">
                        {/* Filters Header - Aligned with Results Header */}
                        <div className="flex items-center justify-between text-text h-[52px]">
                            <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                                <h2 className="text-lg font-bold">Filter</h2>
                            </div>
                            {(selectedOrgs.length > 0 || selectedTags.length > 0 || selectedFormats.length > 0) && (
                                <button
                                    onClick={() => {
                                        setSelectedOrgs([]);
                                        setSelectedTags([]);
                                        setSelectedFormats([]);
                                    }}
                                    className="text-xs text-primary hover:text-secondary font-medium"
                                >
                                    Reset
                                </button>
                            )}
                        </div>

                        {/* Organizations */}
                        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
                            <div className="bg-gradient-to-r from-primary to-secondary px-4 py-3">
                                <h3 className="text-sm font-bold text-white flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Organisasi
                                </h3>
                            </div>
                            <div className="p-4 max-h-64 overflow-y-auto">
                                <ul className="space-y-2">
                                    {orgFacets?.slice(0, 10).map((item: any) => (
                                        <li
                                            key={item.name}
                                            onClick={() => toggleFilter('organization', item.name)}
                                            className={`flex justify-between items-center text-sm py-1.5 px-2 rounded transition-colors cursor-pointer ${selectedOrgs.includes(item.name) ? 'bg-primary/10 text-primary font-semibold' : 'hover:bg-gray-50 text-text'
                                                }`}
                                        >
                                            <span className="truncate pr-2">{item.display_name}</span>
                                            <span className={`py-0.5 px-2 rounded-full text-xs font-semibold ${selectedOrgs.includes(item.name) ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
                                                }`}>{item.count}</span>
                                        </li>
                                    ))}
                                    {!orgFacets?.length && <li className="text-sm text-muted text-center py-2">Tidak ada data</li>}
                                </ul>
                            </div>
                        </div>

                        {/* Tags */}
                        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
                            <div className="bg-gradient-to-r from-primary to-secondary px-4 py-3">
                                <h3 className="text-sm font-bold text-white flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                    </svg>
                                    Tag
                                </h3>
                            </div>
                            <div className="p-4 max-h-64 overflow-y-auto">
                                <div className="flex flex-wrap gap-2">
                                    {tagFacets?.slice(0, 15).map((item: any) => (
                                        <button
                                            key={item.name}
                                            onClick={() => toggleFilter('tag', item.name)}
                                            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedTags.includes(item.name)
                                                ? 'bg-primary text-white shadow-sm'
                                                : 'bg-gray-100 text-gray-700 hover:bg-primary hover:text-white'
                                                }`}
                                        >
                                            {item.display_name}
                                            <span className={`ml-1.5 ${selectedTags.includes(item.name) ? 'opacity-100' : 'opacity-75'}`}>({item.count})</span>
                                        </button>
                                    ))}
                                    {!tagFacets?.length && <p className="text-sm text-muted text-center w-full py-2">Tidak ada data</p>}
                                </div>
                            </div>
                        </div>

                        {/* Formats */}
                        <div className="bg-white rounded-lg shadow-sm border border-border overflow-hidden">
                            <div className="bg-gradient-to-r from-primary to-secondary px-4 py-3">
                                <h3 className="text-sm font-bold text-white flex items-center">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    Format
                                </h3>
                            </div>
                            <div className="p-4">
                                <ul className="space-y-2">
                                    {formatFacets?.slice(0, 10).map((item: any) => (
                                        <li
                                            key={item.name}
                                            onClick={() => toggleFilter('format', item.name)}
                                            className={`flex justify-between items-center text-sm py-1.5 px-2 rounded transition-colors cursor-pointer ${selectedFormats.includes(item.name) ? 'bg-orange-50 text-orange-600 font-semibold' : 'hover:bg-gray-50 text-text'
                                                }`}
                                        >
                                            <span className="font-medium truncate pr-2">{item.display_name}</span>
                                            <span className={`py-0.5 px-2 rounded-full text-xs font-semibold ${selectedFormats.includes(item.name) ? 'bg-orange-600 text-white' : 'bg-orange-500/10 text-orange-600'
                                                }`}>{item.count}</span>
                                        </li>
                                    ))}
                                    {!formatFacets?.length && <li className="text-sm text-muted text-center py-2">Tidak ada data</li>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 min-w-0">
                    {/* Results Header - Fixed height to align with Filter header */}
                    <div className="flex justify-between items-center mb-6 h-[52px]">
                        <div>
                            <h2 className="text-xl font-bold text-text">
                                {total} Dataset Ditemukan
                            </h2>
                        </div>
                        <div className="flex items-center gap-4">
                            {/* View Mode Switcher */}
                            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded transition-colors ${viewMode === 'grid'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-gray-600 hover:text-text'
                                        }`}
                                    title="Grid View"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    className={`p-2 rounded transition-colors ${viewMode === 'list'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-gray-600 hover:text-text'
                                        }`}
                                    title="List View"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setViewMode('compact')}
                                    className={`p-2 rounded transition-colors ${viewMode === 'compact'
                                        ? 'bg-white text-primary shadow-sm'
                                        : 'text-gray-600 hover:text-text'
                                        }`}
                                    title="Compact View"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2zM10 6h4v12h-4z" />
                                    </svg>
                                </button>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-muted">Urutkan:</label>
                                <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-transparent">
                                    <option>Relevansi</option>
                                    <option>Terbaru</option>
                                    <option>Terlama</option>
                                    <option>Abjad A-Z</option>
                                    <option>Abjad Z-A</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Results Grid */}
                    {loading ? (
                        <div className={`grid ${viewMode === 'compact' ? 'grid-cols-1 md:grid-cols-3 gap-4' :
                            viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 gap-6' :
                                'grid-cols-1 gap-3'
                            }`}>
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="animate-pulse bg-white rounded-lg border border-border p-6">
                                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
                                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-5/6 mb-4"></div>
                                    <div className="flex gap-2">
                                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : datasets.length > 0 ? (
                        <div className={`grid ${viewMode === 'compact' ? 'grid-cols-1 md:grid-cols-3 gap-4' :
                            viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 gap-6' :
                                'grid-cols-1 gap-3'
                            }`}>
                            {datasets.map((dataset) => (
                                <Link key={dataset.id} href={`/${dataset.id}`}>
                                    <div className={`group bg-white rounded-lg border border-border transition-all duration-300 hover:shadow-lg hover:border-primary cursor-pointer h-full flex ${viewMode === 'list' ? 'flex-col sm:flex-row p-4 gap-4' :
                                        viewMode === 'compact' ? 'flex-col p-4' :
                                            'flex-col p-6 hover:-translate-y-1'
                                        }`}>

                                        {/* Main Content */}
                                        <div className={viewMode === 'list' ? 'flex-grow min-w-0' : 'flex-grow'}>
                                            <div className={`flex flex-col items-start gap-2 mb-2`}>
                                                {/* Badges - Now always on top */}
                                                <div className="flex flex-wrap gap-2 flex-shrink-0">
                                                    {dataset.organization && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-primary/10 text-primary whitespace-nowrap">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            {dataset.organization.title}
                                                        </span>
                                                    )}
                                                    {dataset.private && (
                                                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                                                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                            </svg>
                                                            Private
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title */}
                                                <h3 className={`font-bold text-text group-hover:text-primary transition-colors ${viewMode === 'compact' ? 'text-base line-clamp-2' :
                                                    viewMode === 'list' ? 'text-lg line-clamp-1' :
                                                        'text-lg line-clamp-2'
                                                    }`}>
                                                    {dataset.title}
                                                </h3>
                                            </div>

                                            {/* Description */}
                                            <p className={`text-sm text-muted ${viewMode === 'compact' ? 'mb-3 line-clamp-2' :
                                                viewMode === 'list' ? 'mb-2 line-clamp-1' :
                                                    'mb-4 line-clamp-2'
                                                }`}>
                                                {dataset.notes || 'Tidak ada deskripsi tersedia.'}
                                            </p>

                                            {/* Footer */}
                                            <div className={`flex items-center ${viewMode === 'list' ? 'gap-4' :
                                                viewMode === 'compact' ? 'justify-between w-full' :
                                                    'justify-between pt-4 border-t border-gray-100'
                                                }`}>
                                                <div className="flex flex-wrap gap-2">
                                                    {(() => {
                                                        const uniqueFormats = Array.from(new Set(dataset.resources?.map(r => r.format) || [])).filter(Boolean);
                                                        const limit = viewMode === 'compact' ? 2 : 3;
                                                        const displayFormats = uniqueFormats.slice(0, limit);
                                                        const remaining = uniqueFormats.length - limit;

                                                        return (
                                                            <>
                                                                {displayFormats.map((format, idx) => (
                                                                    <span key={idx} className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${getFormatColor(format)} text-white uppercase`}>
                                                                        {format}
                                                                    </span>
                                                                ))}
                                                                {remaining > 0 && (
                                                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-600">
                                                                        +{remaining}
                                                                    </span>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                {viewMode !== 'compact' && (
                                                    <div className="flex items-center text-xs text-muted">
                                                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                        {dataset.resources?.length || 0} file
                                                    </div>
                                                )}
                                            </div>

                                            {/* Tags */}
                                            {dataset.tags && dataset.tags.length > 0 && viewMode !== 'list' && (
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {dataset.tags.slice(0, viewMode === 'compact' ? 2 : 3).map((tag) => (
                                                        <span key={tag.name} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                            #{tag.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-200">
                            <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <h3 className="text-lg font-medium text-text mb-2">Tidak ada dataset ditemukan</h3>
                            <p className="text-muted">
                                {searchQuery
                                    ? `Tidak ada hasil untuk pencarian "${searchQuery}". Coba kata kunci lain.`
                                    : 'Belum ada dataset yang tersedia saat ini.'}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {total > ROWS_PER_PAGE && (
                        <div className="flex justify-center items-center mt-12 gap-2">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                                Sebelumnya
                            </button>

                            <div className="flex items-center gap-2 px-4">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (page <= 3) {
                                        pageNum = i + 1;
                                    } else if (page >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = page - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => handlePageChange(pageNum)}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${page === pageNum
                                                ? 'bg-primary text-white'
                                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages}
                                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Selanjutnya
                                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    )}
                </main>
            </div>
        </Layout>
    );
}
