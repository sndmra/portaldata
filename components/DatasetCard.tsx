import Link from 'next/link';

interface Dataset {
    id: string;
    name: string;
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
}

interface DatasetCardProps {
    dataset: Dataset;
}

const DatasetCard = ({ dataset }: DatasetCardProps) => {
    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-border overflow-hidden flex flex-col h-full">
            <div className="p-6 flex-grow">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <p className="text-xs font-semibold text-primary uppercase tracking-wider">
                                {dataset.organization?.title || 'Umum'}
                            </p>
                            {dataset.private && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap">
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    Private
                                </span>
                            )}
                        </div>
                        <Link href={`/${dataset.name}`} className="block mt-1">
                            <h3 className="text-lg font-bold text-text hover:text-primary transition-colors line-clamp-2">
                                {dataset.title}
                            </h3>
                        </Link>
                    </div>
                    {dataset.organization?.image_url && (
                        <img
                            src={dataset.organization.image_url}
                            alt={dataset.organization.title}
                            className="h-10 w-10 rounded-full bg-gray-100 ml-4"
                        />
                    )}
                </div>

                <p className="mt-3 text-sm text-muted line-clamp-3">
                    {dataset.notes || 'Tidak ada deskripsi.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                    {dataset.tags?.slice(0, 3).map((tag) => (
                        <span
                            key={tag.name}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                        >
                            {tag.name}
                        </span>
                    ))}
                </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t border-border flex items-center justify-between">
                <div className="flex items-center text-xs text-muted space-x-4">
                    <span className="flex items-center">
                        <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {dataset.num_resources || 0} File
                    </span>
                    <span className="flex items-center">
                        <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(dataset.metadata_modified)}
                    </span>
                </div>
                <Link href={`/${dataset.name}`} className="text-sm font-medium text-primary hover:text-secondary">
                    Lihat Detail &rarr;
                </Link>
            </div>
        </div>
    );
};

export default DatasetCard;
