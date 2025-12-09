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
        return res.status(500).json({ message: 'Server misconfiguration: Missing Sysadmin Token' });
    }

    // Verify caller token is valid (trusting frontend sysadmin check)
    try {
        await axiosInstance.get(`${getCkanUrl()}/api/3/action/status_show`, {
            headers: { Authorization: callerToken }
        });
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token' });
    }

    try {
        const ckanUrl = getCkanUrl();

        // Fetch all stats in parallel
        const [usersRes, datasetsRes, orgsRes, groupsRes, siteRes] = await Promise.all([
            axiosInstance.get(`${ckanUrl}/api/3/action/user_list`, {
                headers: { Authorization: SYSADMIN_API_TOKEN },
                params: { all_fields: true }
            }),
            axiosInstance.get(`${ckanUrl}/api/3/action/package_search`, {
                headers: { Authorization: SYSADMIN_API_TOKEN },
                params: { rows: 0, include_private: true }
            }),
            axiosInstance.get(`${ckanUrl}/api/3/action/organization_list`, {
                headers: { Authorization: SYSADMIN_API_TOKEN },
                params: { all_fields: true }
            }),
            axiosInstance.get(`${ckanUrl}/api/3/action/group_list`, {
                headers: { Authorization: SYSADMIN_API_TOKEN },
                params: { all_fields: true }
            }),
            axiosInstance.get(`${ckanUrl}/api/3/action/status_show`, {
                headers: { Authorization: SYSADMIN_API_TOKEN }
            })
        ]);

        // Get recent activity
        let recentActivity: any[] = [];
        try {
            const activityRes = await axiosInstance.get(`${ckanUrl}/api/3/action/recently_changed_packages_activity_list`, {
                headers: { Authorization: SYSADMIN_API_TOKEN },
                params: { limit: 10 }
            });
            recentActivity = activityRes.data.result || [];
        } catch (e) {
            // Activity might not be available
        }

        return res.status(200).json({
            success: true,
            stats: {
                users: usersRes.data.result?.length || 0,
                datasets: datasetsRes.data.result?.count || 0,
                organizations: orgsRes.data.result?.length || 0,
                groups: groupsRes.data.result?.length || 0
            },
            recentActivity
        });
    } catch (error: any) {
        console.error('Dashboard API error:', error.message);
        return res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
}
