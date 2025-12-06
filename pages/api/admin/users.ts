import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

// Sysadmin API Token from environment variable
const SYSADMIN_API_TOKEN = process.env.SYSADMIN_API_TOKEN || '';

const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 5000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Security: Verify the requester's token is from a sysadmin user
    const callerToken = req.headers.authorization;

    if (!callerToken) {
        return res.status(401).json({ message: 'Authorization required' });
    }

    // Verify caller is a sysadmin by checking their user info
    try {
        const userResponse = await axiosInstance.get(`${getCkanUrl()}/api/3/action/user_show`, {
            params: { id: 'me' },
            headers: { Authorization: callerToken }
        });

        if (!userResponse.data.success || !userResponse.data.result.sysadmin) {
            return res.status(403).json({ message: 'Access denied. Sysadmin privileges required.' });
        }
    } catch (authError: any) {
        return res.status(403).json({ message: 'Invalid token or access denied' });
    }

    // Simple check: ensure we have the sysadmin token configured for operations
    if (!SYSADMIN_API_TOKEN) {
        return res.status(500).json({ message: 'Server misconfiguration: Missing Sysadmin Token' });
    }

    try {
        if (req.method === 'GET') {
            // List users
            const response = await axiosInstance.get(`${getCkanUrl()}/api/3/action/user_list`, {
                headers: { Authorization: SYSADMIN_API_TOKEN },
                params: { all_fields: true }
            });
            return res.status(200).json({ success: true, users: response.data.result });

        } else if (req.method === 'POST') {
            // Create user
            const { username, email, password, fullname } = req.body;
            const response = await axiosInstance.post(`${getCkanUrl()}/api/3/action/user_create`, {
                name: username,
                email,
                password,
                fullname
            }, {
                headers: { Authorization: SYSADMIN_API_TOKEN }
            });
            return res.status(201).json({ success: true, user: response.data.result });

        } else if (req.method === 'DELETE') {
            // Delete user
            const { id } = req.query;
            if (!id) return res.status(400).json({ message: 'User ID required' });

            await axiosInstance.post(`${getCkanUrl()}/api/3/action/user_delete`, { id }, {
                headers: { Authorization: SYSADMIN_API_TOKEN }
            });
            return res.status(200).json({ success: true, message: 'User deleted' });

        } else {
            return res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error('Admin API Error:', error.message);
        const status = error.response?.status || 500;
        const message = error.response?.data?.error?.message || error.message || 'Internal Server Error';
        return res.status(status).json({ message });
    }
}
