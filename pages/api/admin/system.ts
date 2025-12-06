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
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const callerToken = req.headers.authorization;

    if (!callerToken) {
        return res.status(401).json({ message: 'Authorization required' });
    }

    if (!SYSADMIN_API_TOKEN) {
        return res.status(500).json({ message: 'Server misconfiguration' });
    }

    // Verify caller token is valid (trusting frontend sysadmin check)
    try {
        await axiosInstance.get(`${getCkanUrl()}/api/3/action/site_read`, {
            headers: { Authorization: callerToken }
        });
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }

    const ckanUrl = getCkanUrl();

    try {
        // Fetch system status
        const [statusRes, siteRes] = await Promise.all([
            axiosInstance.get(`${ckanUrl}/api/3/action/status_show`, {
                headers: { Authorization: SYSADMIN_API_TOKEN }
            }),
            axiosInstance.get(`${ckanUrl}/api/3/action/site_read`, {
                headers: { Authorization: SYSADMIN_API_TOKEN }
            })
        ]);

        // Try to get config (might require additional permissions)
        let config = {};
        try {
            const configRes = await axiosInstance.get(`${ckanUrl}/api/3/action/config_option_list`, {
                headers: { Authorization: SYSADMIN_API_TOKEN }
            });
            config = configRes.data.result || {};
        } catch (e) {
            // Config might not be available
        }

        return res.status(200).json({
            success: true,
            status: statusRes.data.result,
            site: siteRes.data.result,
            ckanUrl,
            config
        });
    } catch (error: any) {
        console.error('System API error:', error.response?.data || error.message);
        return res.status(500).json({
            message: 'Failed to fetch system info'
        });
    }
}
