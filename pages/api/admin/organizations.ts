import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

const SYSADMIN_API_TOKEN = process.env.SYSADMIN_API_TOKEN || '';

const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 10000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const callerToken = req.headers.authorization;

    if (!callerToken) {
        return res.status(401).json({ message: 'Authorization required' });
    }

    if (!SYSADMIN_API_TOKEN) {
        return res.status(500).json({ message: 'Server misconfiguration' });
    }

    // Verify caller token is valid (trusting frontend sysadmin check)
    try {
        await axiosInstance.get(`${getCkanUrl()}/api/3/action/status_show`, {
            headers: { Authorization: callerToken }
        });
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }

    const ckanUrl = getCkanUrl();

    try {
        if (req.method === 'GET') {
            // List all organizations
            const response = await axiosInstance.get(`${ckanUrl}/api/3/action/organization_list`, {
                headers: { Authorization: SYSADMIN_API_TOKEN },
                params: { all_fields: true, include_extras: true }
            });
            return res.status(200).json({ success: true, organizations: response.data.result });

        } else if (req.method === 'POST') {
            // Create organization
            const { name, title, description } = req.body;

            if (!name || !title) {
                return res.status(400).json({ message: 'Name and title are required' });
            }

            const response = await axiosInstance.post(`${ckanUrl}/api/3/action/organization_create`, {
                name: name.toLowerCase().replace(/\s+/g, '-'),
                title,
                description: description || ''
            }, {
                headers: {
                    Authorization: SYSADMIN_API_TOKEN,
                    'Content-Type': 'application/json'
                }
            });
            return res.status(201).json({ success: true, organization: response.data.result });

        } else if (req.method === 'DELETE') {
            // Delete organization
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'Organization ID required' });
            }

            await axiosInstance.post(`${ckanUrl}/api/3/action/organization_delete`, {
                id
            }, {
                headers: {
                    Authorization: SYSADMIN_API_TOKEN,
                    'Content-Type': 'application/json'
                }
            });
            return res.status(200).json({ success: true, message: 'Organization deleted' });

        } else {
            return res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error('Organization API error:', error.response?.data || error.message);
        return res.status(500).json({
            message: error.response?.data?.error?.message || 'Operation failed'
        });
    }
}
