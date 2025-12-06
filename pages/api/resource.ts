import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export const config = {
    api: {
        responseLimit: '10mb', // Support larger files
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.query;
    const apiKey = req.headers.authorization;

    // Log for debugging

    if (!url || typeof url !== 'string') {
        console.error('[Resource Proxy] Invalid URL:', url);
        return res.status(400).json({ error: 'Resource URL required' });
    }

    // CRITICAL FIX: Replace localhost URLs with actual CKAN backend URL
    // CKAN stores resource URLs with its own base URL (often localhost in dev)
    // but needs the actual backend URL in production (e.g., ngrok URL)
    let resourceUrl = url;
    const ckanBackendUrl = process.env.NEXT_PUBLIC_CKAN_URL || process.env.CKAN_URL;

    if (ckanBackendUrl && (url.includes('localhost:5001') || url.includes('localhost:5002'))) {
        // Replace localhost:5001 or localhost:5002 with actual CKAN URL
        resourceUrl = url.replace(/http:\/\/localhost:500[12]/, ckanBackendUrl);
    }

    // Validate URL format
    try {
        new URL(resourceUrl);
    } catch (urlError) {
        console.error('[Resource Proxy] Malformed URL:', resourceUrl, urlError);
        return res.status(400).json({
            error: 'Invalid URL format',
            receivedUrl: url,
            rewrittenUrl: resourceUrl
        });
    }

    try {

        // Fetch resource from CKAN with auth headers
        const response = await axios.get(resourceUrl, {
            responseType: 'arraybuffer', // Get raw bytes
            headers: apiKey ? { Authorization: apiKey } : {},
            maxContentLength: 10 * 1024 * 1024, // 10MB limit
        });


        // Forward content-type from CKAN response
        const contentType = response.headers['content-type'] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);

        // Forward content-disposition if present (for filenames)
        if (response.headers['content-disposition']) {
            res.setHeader('Content-Disposition', response.headers['content-disposition']);
        }

        // Send the file data
        res.status(200).send(response.data);
    } catch (error: any) {
        console.error('[Resource Proxy] Error fetching resource:', {
            originalUrl: url,
            rewrittenUrl: resourceUrl,
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        return res.status(error.response?.status || 500).json({
            error: 'Failed to fetch resource',
            details: error.response?.data?.error?.message || error.message,
            originalUrl: url,
            attemptedUrl: resourceUrl
        });
    }
}
