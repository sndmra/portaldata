import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getCkanUrl } from '@/lib/ckan';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const CKAN_URL = getCkanUrl();
        const apiKey = req.headers.authorization;
        const headers = apiKey ? { Authorization: apiKey } : {};

        const [orgsRes, groupsRes, datasetsRes] = await Promise.all([
            axios.get(`${CKAN_URL}/api/3/action/organization_list`, { headers }),
            axios.get(`${CKAN_URL}/api/3/action/group_list`, { headers }),
            axios.get(`${CKAN_URL}/api/3/action/package_search`, {
                params: { rows: 0 },
                headers
            })
        ]);

        res.status(200).json({
            success: true,
            result: {
                organizations: orgsRes.data.result.length,
                groups: groupsRes.data.result.length,
                datasets: datasetsRes.data.result.count
            }
        });
    } catch (error: any) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch statistics'
        });
    }
}
