import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

// Sysadmin API Token from environment variable
const SYSADMIN_API_TOKEN = process.env.SYSADMIN_API_TOKEN || '';

const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 10000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { id, limit } = req.query;

    if (!id) {
        return res.status(400).json({ message: 'Dataset ID is required' });
    }

    try {
        const response = await axiosInstance.get(`${getCkanUrl()}/api/3/action/package_activity_list`, {
            params: { id, limit },
            headers: {
                'Authorization': SYSADMIN_API_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error('Activity proxy error:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ message: 'Failed to fetch activities' });
    }
}
