import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

// Axios instance to prevent socket hang up
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 10000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fullname, email, about } = req.body;
    const apiKey = req.headers.authorization;

    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }

    const ckanUrl = getCkanUrl();

    try {
        // First get user data to get the user ID
        const userShowRes = await axiosInstance.get(`${ckanUrl}/api/3/action/user_show`, {
            params: { id: 'me' },
            headers: { Authorization: apiKey }
        });

        const userId = userShowRes.data.result.id;

        // Update user profile
        const updateRes = await axiosInstance.post(`${ckanUrl}/api/3/action/user_update`, {
            id: userId,
            fullname: fullname,
            email: email,
            about: about
        }, {
            headers: { Authorization: apiKey }
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
