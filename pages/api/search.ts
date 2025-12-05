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

    try {
        // Forward all query parameters
        const params = { ...req.query };

        // Ensure include_private is true to fetch all datasets
        params.include_private = 'true';

        const response = await axiosInstance.get(`${getCkanUrl()}/api/3/action/package_search`, {
            params,
            headers: {
                'Authorization': SYSADMIN_API_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error('Search proxy error:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ message: 'Search failed' });
    }
}
