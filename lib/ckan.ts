export const getCkanUrl = (): string => {
    // Check if NEXT_PUBLIC_CKAN_URL is defined in environment variables
    if (process.env.NEXT_PUBLIC_CKAN_URL) {
        return process.env.NEXT_PUBLIC_CKAN_URL;
    }

    // Fallback to localhost if not defined
    return "http://localhost:5001";
};
