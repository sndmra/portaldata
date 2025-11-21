import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

// Reuse the token from register.ts
const SYSADMIN_API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI3LXF0X1lablAybEtfVGJLcjQ5anpQQ3A5TzA5eFNlVFplUm80UE1YcnNBIiwiaWF0IjoxNzYzNTYxNDQxfQ.9wO7PmNFeLelaLng41gvIU9-M6Y5bao7Q5eBN4bGtNE';
// const CKAN_URL = 'http://localhost:5001';

const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 10000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    try {
        // Forward all query parameters
        const params = { ...req.query };

        // Ensure include_private is true to fetch all datasets
        params.include_private = 'true';

        const response = await axiosInstance.get(`${getCkanUrl()}/api/3/action/package_search`, {
            params,
            headers: {
                'Authorization': SYSADMIN_API_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        return res.status(200).json(response.data);
    } catch (error: any) {
        console.error('Search proxy error:', error.message);
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        return res.status(500).json({ message: 'Search failed' });
    }
}
