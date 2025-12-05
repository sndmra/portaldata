import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

// Sysadmin API Token from environment variable
const SYSADMIN_API_TOKEN = process.env.SYSADMIN_API_TOKEN || '';

// Create an axios instance with a new agent to avoid socket hang up issues
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 5000,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        // Step 1: Verify credentials by attempting to log in to CKAN web interface
        // We use URLSearchParams to send form-urlencoded data
        const params = new URLSearchParams();
        params.append('login', username);
        params.append('password', password);

        // We need to hit the generic login endpoint
        // Note: CKAN might redirect on success. We need to check if we get a session cookie or redirect.
        // However, axios follows redirects by default.
        // If login fails, CKAN usually returns the login page again (200 OK) but with an error message in HTML.
        // If login succeeds, it redirects to the dashboard or user page.

        // A better way to verify credentials without parsing HTML is to check if the response URL changed
        // or if we got a specific cookie.
        // But actually, since we have a sysadmin token, we can just use it to fetch the user?
        // NO, we must verify the password first. The sysadmin token allows us to fetch the API key, 
        // but it doesn't help us verify the user's password unless we trust the user input (which we don't).

        // Let's try the POST request.
        console.log('Attempting login for user:', username);
        const CKAN_URL = getCkanUrl();
        const loginResponse = await axiosInstance.post(`${CKAN_URL}/login_generic`, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            maxRedirects: 0, // Don't follow redirects so we can check the 302 status
            validateStatus: (status) => status >= 200 && status < 500, // Accept all status codes for debugging
        });

        console.log('Login response status:', loginResponse.status);
        console.log('Login response headers:', loginResponse.headers);

        // Check if we got a redirect (302) which usually indicates success in CKAN
        // If we get 200, it means we are still on the login page (failure)
        if (loginResponse.status === 302 || loginResponse.status === 303) {
            console.log('Login successful (redirect detected)');
            // Login successful!

            // Step 2: Fetch user details and API Key using Sysadmin Token
            // We use a new axios instance or ensure headers are clean
            console.log('Fetching user details for:', username);

            try {
                const userResponse = await axiosInstance.get(`${CKAN_URL}/api/3/action/user_show`, {
                    params: { id: username },
                    headers: {
                        'Authorization': SYSADMIN_API_TOKEN
                    }
                });

                const userData = userResponse.data.result;

                let apiKey = userData.apikey;

                // If user has no legacy API key, generate a new API Token
                if (!apiKey) {
                    console.log('No legacy API key found, generating new token...');
                    try {
                        const tokenResponse = await axiosInstance.post(`${getCkanUrl()}/api/3/action/api_token_create`, {
                            user: username,
                            name: `frontend-login-${Date.now()}`
                        }, {
                            headers: {
                                'Authorization': SYSADMIN_API_TOKEN,
                                'Content-Type': 'application/json'
                            }
                        });
                        apiKey = tokenResponse.data.result.token;
                        console.log('New token generated successfully');
                    } catch (tokenError: any) {
                        console.error('Error creating token:', tokenError.message);
                        if (tokenError.response) {
                            console.error('Token error response:', tokenError.response.data);
                        }
                        return res.status(500).json({ message: 'Failed to generate API token for user.' });
                    }
                }

                return res.status(200).json({
                    success: true,
                    apikey: apiKey,
                    user: {
                        id: userData.id,
                        name: userData.name,
                        fullname: userData.fullname,
                        email: userData.email,
                        sysadmin: userData.sysadmin
                    }
                });
            } catch (userError: any) {
                console.error('Error fetching user details:', userError.message);
                if (userError.code === 'ECONNRESET' || userError.message.includes('socket hang up')) {
                    return res.status(500).json({ message: 'Backend connection failed. Please try again.' });
                }
                return res.status(500).json({ message: 'Failed to retrieve user details.' });
            }
        } else {
            // Login failed (likely returned 200 OK with login form)
            return res.status(401).json({ message: 'Invalid username or password' });
        }

    } catch (error: any) {
        console.error('Login error:', error.message);
        // If axios throws on 302 (it shouldn't with validateStatus), handle it.
        // If it's a network error or 500, return error.
        return res.status(401).json({ message: 'Authentication failed. Please check your credentials.' });
    }
}
