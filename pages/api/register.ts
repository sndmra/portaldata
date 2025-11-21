import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

// Sysadmin API Token generated via CLI
// In production, this should be in process.env.SYSADMIN_API_TOKEN
const SYSADMIN_API_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJqdGkiOiI3LXF0X1lablAybEtfVGJLcjQ5anpQQ3A5TzA5eFNlVFplUm80UE1YcnNBIiwiaWF0IjoxNzYzNTYxNDQxfQ.9wO7PmNFeLelaLng41gvIU9-M6Y5bao7Q5eBN4bGtNE';
// const CKAN_URL = 'http://localhost:5001'; // Accessing from host machine since Next.js runs on host

// Create an axios instance with a new agent to avoid socket hang up issues
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 5000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { username, email, password, fullname } = req.body;

    if (!username || !email || !password || !fullname) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        console.log('Attempting to create user:', username);

        const response = await axiosInstance.post(`${getCkanUrl()}/api/3/action/user_create`, {
            name: username,
            email: email,
            password: password,
            fullname: fullname
        }, {
            headers: {
                'Authorization': SYSADMIN_API_TOKEN,
                'Content-Type': 'application/json'
            }
        });

        if (response.data.success) {
            console.log('User created successfully:', username);
            return res.status(201).json({ success: true, user: response.data.result });
        } else {
            throw new Error('CKAN returned success: false');
        }

    } catch (error: any) {
        console.error('Registration error:', error.message);
        if (error.response) {
            console.error('CKAN Error Response:', error.response.data);
            // Handle specific CKAN errors (e.g., user already exists)
            if (error.response.data.error && error.response.data.error.name) {
                if (Array.isArray(error.response.data.error.name)) {
                    return res.status(409).json({ message: `Username ${error.response.data.error.name[0]}` });
                }
            }
            if (error.response.data.error && error.response.data.error.message) {
                return res.status(400).json({ message: error.response.data.error.message });
            }
        }
        return res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
}
