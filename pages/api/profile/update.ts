import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

// Sysadmin token for write operations (workaround for CKAN 2.11 JWT issue)
const SYSADMIN_API_TOKEN = process.env.SYSADMIN_API_TOKEN || '';

// Axios instance to prevent socket hang up
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 10000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fullname, email, about, userId } = req.body;
    const userApiKey = req.headers.authorization;

    if (!userApiKey) {
        return res.status(401).json({ error: 'API key required' });
    }

    if (!SYSADMIN_API_TOKEN) {
        return res.status(500).json({ error: 'Server configuration error: Missing sysadmin token' });
    }

    if (!userId) {
        return res.status(400).json({ error: 'userId required in request body' });
    }

    const ckanUrl = getCkanUrl();

    try {
        // Update user profile using sysadmin token
        const updateRes = await axiosInstance.post(`${ckanUrl}/api/3/action/user_update`, {
            id: userId,
            fullname: fullname,
            email: email,
            about: about
        }, {
            headers: { Authorization: SYSADMIN_API_TOKEN }
        });

        return res.status(200).json({ success: true, result: updateRes.data.result });
    } catch (error: any) {
        console.error('Error updating user profile:', error.response?.data || error.message);
        return res.status(500).json({
            error: 'Failed to update profile',
            details: error.response?.data?.error?.message || error.message
        });
    }
}
