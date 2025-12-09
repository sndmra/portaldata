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

        // Filter out redundant "updated" activities that happen right after "created"
        // This occurs when uploading a dataset with resources - resource_create triggers package_update
        let filteredActivities = response.data.result || [];
        if (filteredActivities.length > 1) {
            const createdActivities = new Map<string, Date>();

            // First pass: find all "new package" activities
            filteredActivities.forEach((activity: any) => {
                if (activity.activity_type === 'new package') {
                    const key = `${activity.object_id}-${activity.user_id}`;
                    createdActivities.set(key, new Date(activity.timestamp));
                }
            });

            // Second pass: filter out "changed package" activities within 60 seconds of creation
            filteredActivities = filteredActivities.filter((activity: any) => {
                if (activity.activity_type === 'changed package') {
                    const key = `${activity.object_id}-${activity.user_id}`;
                    const createdTime = createdActivities.get(key);
                    if (createdTime) {
                        const changedTime = new Date(activity.timestamp);
                        const diffSeconds = Math.abs((changedTime.getTime() - createdTime.getTime()) / 1000);
                        if (diffSeconds <= 60) {
                            return false; // Filter out this activity
                        }
                    }
                }
                return true;
            });
        }

        // Set cache control headers to prevent browser/CDN caching
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');

        return res.status(200).json({ ...response.data, result: filteredActivities });
    } catch (error: any) {
        console.error('[Activity API] Error:', error.message);
        if (error.response) {
            // Check if this is because activity APIs are not available in CKAN 2.11
            const errorMsg = error.response.data;
            if (typeof errorMsg === 'string' && errorMsg.includes('Action name not known')) {
                return res.status(200).json({ success: true, result: [] });
            }
            console.error('[Activity API] CKAN error response:', error.response.data);
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ message: 'Failed to fetch activities' });
    }
}
