import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

// Use sysadmin token for stats - these are public counts that shouldn't require user auth
const SYSADMIN_API_TOKEN = process.env.SYSADMIN_API_TOKEN || '';

// Create axios instance with keep-alive disabled to prevent socket hang up
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 10000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        const CKAN_URL = getCkanUrl();
        // Use sysadmin token for public stats - don't rely on user token which could be invalid
        const headers = SYSADMIN_API_TOKEN ? { Authorization: SYSADMIN_API_TOKEN } : {};

        const [orgsRes, groupsRes, datasetsRes] = await Promise.all([
            axiosInstance.get(`${CKAN_URL}/api/3/action/organization_list`, { headers }),
            axiosInstance.get(`${CKAN_URL}/api/3/action/group_list`, { headers }),
            axiosInstance.get(`${CKAN_URL}/api/3/action/package_search`, {
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
