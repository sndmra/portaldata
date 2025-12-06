import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

// Sysadmin token for public data - organization list is public
const SYSADMIN_API_TOKEN = process.env.SYSADMIN_API_TOKEN || '';

// Axios instance to prevent socket hang up
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 10000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const userApiKey = req.headers.authorization;
    const ckanUrl = getCkanUrl();

    // Use sysadmin token if user is not authenticated (org list is public)
    const apiKey = userApiKey || SYSADMIN_API_TOKEN;

    try {
        const response = await axiosInstance.get(`${ckanUrl}/api/3/action/organization_list`, {
            params: { all_fields: true },
            headers: apiKey ? { Authorization: apiKey } : {}
        });

        return res.status(200).json({ success: true, result: response.data.result });
    } catch (error: any) {
        return res.status(500).json({
            error: 'Failed to fetch organizations',
            details: error.response?.data?.error?.message || error.message
        });
    }
}
