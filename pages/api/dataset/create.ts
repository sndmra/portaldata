import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

// Axios instance to prevent socket hang up
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 30000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = req.headers.authorization;

    if (!apiKey) {
        return res.status(401).json({ error: 'Unauthorized: API Key missing' });
    }

    try {
        const ckanUrl = getCkanUrl();

        const response = await axiosInstance.post(
            `${ckanUrl}/api/3/action/package_create`,
            req.body,
            {
                headers: {
                    Authorization: apiKey,
                    'Content-Type': 'application/json',
                },
            }
        );

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error('[Dataset Create Proxy] Error creating dataset:', error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({
            error: 'Failed to create dataset',
            details: error.response?.data?.error?.message || error.message,
            validation_errors: error.response?.data?.error
        });
    }
}
