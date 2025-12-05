import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    const { id } = req.body;
    if (!id) {
        return res.status(400).json({ error: 'Dataset ID is required' });
    }

    try {
        const ckanUrl = getCkanUrl();
        const response = await axiosInstance.post(
            `${ckanUrl}/api/3/action/package_delete`,
            { id },
            {
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: authHeader,
                },
            }
        );

        res.status(200).json(response.data);
    } catch (error: any) {
        console.error('Error deleting dataset:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data || { message: 'Failed to delete dataset' },
        });
    }
}
