import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Authorization header required' });
    }

    try {
        const ckanUrl = getCkanUrl();
        const response = await axiosInstance.get(`${ckanUrl}/api/3/action/organization_list_for_user`, {
            headers: { Authorization: authHeader },
        });

        res.status(200).json(response.data);
    } catch (error: any) {
        console.error('Error fetching user organizations:', error.response?.data || error.message);
        res.status(error.response?.status || 500).json({
            error: error.response?.data || { message: 'Failed to fetch user organizations' },
        });
    }
}
