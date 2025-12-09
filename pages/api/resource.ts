import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';

// Axios instance to prevent socket hang up
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 300000, // 5 minutes for large GeoTIFF downloads
});

export const config = {
    api: {
        responseLimit: '500mb', // Support large GeoTIFF files
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { url } = req.query;
    const apiKey = req.headers.authorization;

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Resource URL required' });
    }

    // Replace localhost URLs with actual CKAN backend URL
    let resourceUrl = url;
    const ckanBackendUrl = process.env.NEXT_PUBLIC_CKAN_URL || process.env.CKAN_URL;

    if (ckanBackendUrl && (url.includes('localhost:5001') || url.includes('localhost:5002'))) {
        resourceUrl = url.replace(/http:\/\/localhost:500[12]/, ckanBackendUrl);
    }

    // Validate URL format
    try {
        new URL(resourceUrl);
    } catch (urlError) {
        return res.status(400).json({
            error: 'Invalid URL format',
            receivedUrl: url,
            rewrittenUrl: resourceUrl
        });
    }

    try {
        // Fetch resource from CKAN with auth headers
        const response = await axiosInstance.get(resourceUrl, {
            responseType: 'arraybuffer',
            headers: apiKey ? { Authorization: apiKey } : {},
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
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
