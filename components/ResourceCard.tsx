interface Resource {
    id: string;
    name: string;
    format: string;
    url: string;
    created?: string;
    size?: number;
}

interface ResourceCardProps {
    resource: Resource;
}

const ResourceCard = ({ resource }: ResourceCardProps) => {
    const getFormatColor = (format: string) => {
        const fmt = format.toLowerCase();
        if (fmt === 'csv') return 'bg-green-100 text-green-800';
        if (fmt === 'pdf') return 'bg-red-100 text-red-800';
        if (fmt === 'json') return 'bg-yellow-100 text-yellow-800';
        if (fmt === 'xlsx' || fmt === 'xls') return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-800';
    };

    return (
        <div className="bg-white border border-border rounded-lg p-4 hover:shadow-sm transition-shadow flex items-center justify-between group">
            <div className="flex items-center space-x-4">
                <div className={`flex-shrink-0 h-10 w-10 rounded-lg flex items-center justify-center font-bold text-xs uppercase ${getFormatColor(resource.format)}`}>
                    {resource.format}
                </div>
                <div>
                    <h4 className="text-sm font-medium text-text group-hover:text-primary transition-colors">
                        {resource.name || 'Unnamed Resource'}
                    </h4>
                    <p className="text-xs text-muted mt-0.5">
                        {resource.url}
                    </p>
                </div>
            </div>
            <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-primary bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
            >
                <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
            </a>
        </div>
    );
};

export default ResourceCard;
