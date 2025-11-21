import { useState, useEffect } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import dynamic from 'next/dynamic';

// Import GeoViewer dynamically to avoid SSR issues with Leaflet
const GeoViewer = dynamic(() => import('./GeoViewer'), { ssr: false });

interface FileViewerProps {
    resourceUrl: string;
    fileName: string;
    format: string;
    onClose: () => void;
    apiKey?: string | null;
}

export default function FileViewer({ resourceUrl, fileName, format, onClose, apiKey }: FileViewerProps) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [content, setContent] = useState<any>(null);
    const [viewType, setViewType] = useState<'table' | 'text' | 'pdf' | 'geo' | 'unsupported'>('unsupported');
    const [pdfUrl, setPdfUrl] = useState<string>('');

    useEffect(() => {
        detectViewType();
        return () => {
            // Cleanup PDF blob URL if exists
            if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        };
    }, [format, fileName]);

    useEffect(() => {
        if (viewType !== 'unsupported' && viewType !== 'geo') {
            loadContent();
        } else if (viewType === 'geo') {
            setLoading(false);
        }
    }, [viewType]);

    const detectViewType = () => {
        const ext = format.toLowerCase() || fileName.split('.').pop()?.toLowerCase();

        if (['xlsx', 'xls', 'csv'].includes(ext || '')) {
            setViewType('table');
        } else if (['txt', 'json', 'xml', 'html', 'md'].includes(ext || '')) {
            if (ext === 'json' || ext === 'geojson') {
                if (ext === 'geojson') {
                    setViewType('geo');
                    return;
                }
            }
            setViewType('text');
        } else if (ext === 'pdf') {
            setViewType('pdf');
        } else if (['tif', 'tiff'].includes(ext || '')) {
            setViewType('geo');
        } else {
            setViewType('unsupported');
            setLoading(false);
        }
    };

    const getHeaders = () => {
        const headers: any = {};
        if (apiKey) headers.Authorization = apiKey;
        return headers;
    };

    const loadContent = async () => {
        try {
            setLoading(true);
            setError('');

            if (viewType === 'table') {
                await loadTableData();
            } else if (viewType === 'text') {
                await loadTextData();
            } else if (viewType === 'pdf') {
                await loadPdfData();
            }
        } catch (err: any) {
            console.error('Error loading file:', err);
            setError('Gagal memuat file. ' + (err.message || ''));
        } finally {
            setLoading(false);
        }
    };

    const loadPdfData = async () => {
        // Use proxy API to fetch PDF
        const response = await axios.get('/api/resource', {
            params: { url: resourceUrl },
            responseType: 'blob',
            headers: getHeaders()
        });
        const url = URL.createObjectURL(response.data);
        setPdfUrl(url);
    };

    const loadTableData = async () => {
        // Use proxy API to fetch table data
        const response = await axios.get('/api/resource', {
            params: { url: resourceUrl },
            responseType: 'arraybuffer',
            headers: getHeaders()
        });
        const ext = format.toLowerCase() || fileName.split('.').pop()?.toLowerCase();

        if (ext === 'csv') {
            const text = new TextDecoder().decode(response.data);
            const parsed = Papa.parse(text, { header: true });
            setContent({
                headers: parsed.meta.fields || [],
                rows: parsed.data
            });
        } else {
            // Excel files
            const workbook = XLSX.read(response.data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

            if (jsonData.length > 0) {
                const headers = jsonData[0] as any[];
                const rows = jsonData.slice(1).map((row: any) => {
                    const obj: any = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index];
                    });
                    return obj;
                });
                setContent({ headers, rows });
            }
        }
    };

    const loadTextData = async () => {
        // Use proxy API to fetch text data
        const response = await axios.get('/api/resource', {
            params: { url: resourceUrl },
            responseType: 'text',
            headers: getHeaders()
        });
        const ext = format.toLowerCase() || fileName.split('.').pop()?.toLowerCase();
        setContent({ text: response.data, language: ext });
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col m-4">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200">
                    <div>
                        <h3 className="text-lg font-bold text-text">{fileName}</h3>
                        <p className="text-sm text-muted">Format: {format.toUpperCase()}</p>
                    </div>
                    <div className="flex gap-2">
                        <a
                            href={`/api/resource?url=${encodeURIComponent(resourceUrl)}`}
                            download
                            className="px-4 py-2 text-sm font-medium text-primary hover:text-secondary border border-primary hover:border-secondary rounded-md transition-colors"
                        >
                            Download
                        </a>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 border border-gray-300 rounded-md transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading && (
                        <div className="flex justify-center items-center h-full">
                            <div className="text-muted">Loading file...</div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}

                    {!loading && !error && viewType === 'table' && content && (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        {content.headers.map((header: string, index: number) => (
                                            <th
                                                key={index}
                                                className="px-4 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider border-r border-gray-300"
                                            >
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {content.rows.slice(0, 100).map((row: any, rowIndex: number) => (
                                        <tr key={rowIndex} className="hover:bg-gray-50">
                                            {content.headers.map((header: string, colIndex: number) => (
                                                <td
                                                    key={colIndex}
                                                    className="px-4 py-2 text-sm text-gray-900 border-r border-gray-200"
                                                >
                                                    {row[header]}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {content.rows.length > 100 && (
                                <p className="mt-4 text-sm text-muted text-center">
                                    Menampilkan 100 baris pertama dari {content.rows.length} total baris. Download file untuk melihat semua data.
                                </p>
                            )}
                        </div>
                    )}

                    {!loading && !error && viewType === 'text' && content && (
                        <div className="bg-gray-900 rounded-md overflow-hidden">
                            <SyntaxHighlighter
                                language={content.language === 'txt' ? 'text' : content.language}
                                style={vscDarkPlus}
                                showLineNumbers
                                customStyle={{
                                    margin: 0,
                                    padding: '1rem',
                                    fontSize: '0.875rem',
                                }}
                            >
                                {content.text}
                            </SyntaxHighlighter>
                        </div>
                    )}

                    {!loading && !error && viewType === 'pdf' && pdfUrl && (
                        <div className="h-full">
                            <iframe
                                src={pdfUrl}
                                className="w-full h-full min-h-[600px] border border-gray-300 rounded-md"
                                title={fileName}
                            />
                        </div>
                    )}

                    {!loading && !error && viewType === 'geo' && (
                        <GeoViewer
                            resourceUrl={resourceUrl}
                            fileName={fileName}
                            format={format}
                        />
                    )}

                    {!loading && !error && viewType === 'unsupported' && (
                        <div className="text-center py-12">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                            </svg>
                            <p className="mt-2 text-sm text-muted">
                                Format file ini tidak didukung untuk preview. Silakan download file untuk melihat isinya.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
