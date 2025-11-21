import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getCkanUrl } from '@/lib/ckan';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = req.headers.authorization;
    const ckanUrl = getCkanUrl();

    try {
        const response = await axios.get(`${ckanUrl}/api/3/action/organization_list`, {
            params: { all_fields: true },
            headers: apiKey ? { Authorization: apiKey } : {}
        });

        return res.status(200).json({ success: true, result: response.data.result });
    } catch (error: any) {
        console.error('Error fetching organizations:', error.response?.data || error.message);
        return res.status(500).json({
            error: 'Failed to fetch organizations',
            details: error.response?.data?.error?.message || error.message
        });
    }
}
