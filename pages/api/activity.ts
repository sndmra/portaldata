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

    const ckanUrl = getCkanUrl();
    console.log(`[Activity API] Fetching activities for dataset: ${id}`);
    console.log(`[Activity API] CKAN URL: ${ckanUrl}/api/3/action/package_activity_list`);

    try {
        const response = await axiosInstance.get(`${ckanUrl}/api/3/action/package_activity_list`, {
            params: {
                id,
                limit: limit || 50
            },
            headers: {
                'Authorization': SYSADMIN_API_TOKEN,
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache'
            }
        });

        // Debug: Log what CKAN returned
        console.log(`[Activity API] CKAN returned ${response.data.result?.length || 0} activities`);
        if (response.data.result && response.data.result.length > 0) {
            console.log(`[Activity API] Most recent activity:`, {
                timestamp: response.data.result[0].timestamp,
                activity_type: response.data.result[0].activity_type,
                user_id: response.data.result[0].user_id
            });
        }

        // Set cache control headers to prevent browser/CDN caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error('[Activity API] Error:', error.message);
        if (error.response) {
            console.error('[Activity API] CKAN error response:', error.response.data);
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ message: 'Failed to fetch activities' });
    }
}
