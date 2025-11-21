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

    if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: 'Resource URL required' });
    }

    try {
        // Fetch resource from CKAN with auth headers
        const response = await axios.get(url, {
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
        console.error('Error fetching resource:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({
            error: 'Failed to fetch resource',
            details: error.response?.data?.error?.message || error.message
        });
    }
}
