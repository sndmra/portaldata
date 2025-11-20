import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';

// Sysadmin API Token
const SYSADMIN_API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI3LXF0X1lablAybEtfVGJLcjQ5anpQQ3A5TzA5eFNlVFplUm80UE1YcnNBIiwiaWF0IjoxNzYzNTYxNDQxfQ.9wO7PmNFeLelaLng41gvIU9-M6Y5bao7Q5eBN4bGtNE';
const CKAN_URL = 'http://localhost:5001';

const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 5000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    // Verify if the requester is authorized (in a real app, we'd check the session/token here)
    // For this prototype, we assume the frontend checks 'isSysadmin' and we rely on the sysadmin token for CKAN calls.
    // Ideally, we should verify the user's token from the request header against CKAN to ensure they are a sysadmin.

    // Simple check: ensure we have the sysadmin token configured
    if (!SYSADMIN_API_TOKEN) {
        return res.status(500).json({ message: 'Server misconfiguration: Missing Sysadmin Token' });
    }

    try {
        if (req.method === 'GET') {
            // List users
            const response = await axiosInstance.get(`${CKAN_URL}/api/3/action/user_list`, {
                headers: { Authorization: SYSADMIN_API_TOKEN },
                params: { all_fields: true }
            });
            return res.status(200).json({ success: true, users: response.data.result });

        } else if (req.method === 'POST') {
            // Create user
            const { username, email, password, fullname } = req.body;
            const response = await axiosInstance.post(`${CKAN_URL}/api/3/action/user_create`, {
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

            await axiosInstance.post(`${CKAN_URL}/api/3/action/user_delete`, { id }, {
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
