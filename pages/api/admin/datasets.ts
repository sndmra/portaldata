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
            // List all datasets with search
            const { q, rows = 50, start = 0 } = req.query;

            const response = await axiosInstance.get(`${ckanUrl}/api/3/action/package_search`, {
                headers: { Authorization: SYSADMIN_API_TOKEN },
                params: {
                    q: q || '*:*',
                    rows,
                    start,
                    include_private: true,
                    sort: 'metadata_modified desc'
                }
            });

            return res.status(200).json({
                success: true,
                datasets: response.data.result.results,
                count: response.data.result.count
            });

        } else if (req.method === 'DELETE') {
            // Delete dataset
            const { id, purge } = req.query;

            if (!id) {
                return res.status(400).json({ message: 'Dataset ID required' });
            }

            const action = purge === 'true' ? 'dataset_purge' : 'package_delete';

            await axiosInstance.post(`${ckanUrl}/api/3/action/${action}`, {
                id
            }, {
                headers: {
                    Authorization: SYSADMIN_API_TOKEN,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).json({
                success: true,
                message: purge === 'true' ? 'Dataset purged permanently' : 'Dataset deleted'
            });

        } else {
            return res.status(405).json({ message: 'Method not allowed' });
        }
    } catch (error: any) {
        console.error('Dataset Admin API error:', error.response?.data || error.message);
        return res.status(500).json({
            message: error.response?.data?.error?.message || 'Operation failed'
        });
    }
}
