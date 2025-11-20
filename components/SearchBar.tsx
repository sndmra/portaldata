import React from 'react';

interface SearchBarProps {
    placeholder?: string;
    onSearch?: (query: string) => void;
}

const SearchBar = ({ placeholder = "Cari dataset, organisasi, grup...", onSearch }: SearchBarProps) => {
    return (
        <div className="relative w-full max-w-3xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
            <input
                type="text"
                className="block w-full pl-10 pr-3 py-4 border border-transparent rounded-lg leading-5 bg-white shadow-sm placeholder-muted focus:outline-none focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition duration-150 ease-in-out"
                placeholder={placeholder}
                onChange={(e) => onSearch && onSearch(e.target.value)}
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button className="bg-primary text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-secondary transition-colors">
                    Cari
                </button>
            </div>
        </div>
    );
};

export default SearchBar;
