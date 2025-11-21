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
    console.log('[Resource Proxy] Received URL parameter:', url);
    console.log('[Resource Proxy] Query params:', req.query);

    if (!url || typeof url !== 'string') {
        console.error('[Resource Proxy] Invalid URL:', url);
        return res.status(400).json({ error: 'Resource URL required' });
    }

    // Validate URL format
    try {
        new URL(url);
    } catch (urlError) {
        console.error('[Resource Proxy] Malformed URL:', url, urlError);
        return res.status(400).json({
            error: 'Invalid URL format',
            receivedUrl: url
        });
    }

    try {
        console.log('[Resource Proxy] Fetching resource from:', url);

        // Fetch resource from CKAN with auth headers
        const response = await axios.get(url, {
            responseType: 'arraybuffer', // Get raw bytes
            headers: apiKey ? { Authorization: apiKey } : {},
            maxContentLength: 10 * 1024 * 1024, // 10MB limit
        });

        console.log('[Resource Proxy] Successfully fetched resource, size:', response.data.length, 'bytes');

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
            url,
            error: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        return res.status(error.response?.status || 500).json({
            error: 'Failed to fetch resource',
            details: error.response?.data?.error?.message || error.message,
            url: url
        });
    }
}
