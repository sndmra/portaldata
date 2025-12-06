import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { getCkanUrl } from '@/lib/ckan';

// Sysadmin API Token from environment variable
const SYSADMIN_API_TOKEN = process.env.SYSADMIN_API_TOKEN || '';

// Create an axios instance with a new agent to avoid socket hang up issues
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 10000,
});

// Helper function to cleanup old frontend-login tokens for a user
async function cleanupOldFrontendTokens(username: string, ckanUrl: string): Promise<void> {
    try {
        // List all tokens for the user
        const tokenListResponse = await axiosInstance.post(
            `${ckanUrl}/api/3/action/api_token_list`,
            { user: username },
            { headers: { 'Authorization': SYSADMIN_API_TOKEN } }
        );

        if (tokenListResponse.data.success && tokenListResponse.data.result) {
            const tokens = tokenListResponse.data.result;

            // Filter for frontend-login tokens and revoke them
            for (const token of tokens) {
                if (token.name && token.name.startsWith('frontend-login-')) {
                    try {
                        await axiosInstance.post(
                            `${ckanUrl}/api/3/action/api_token_revoke`,
                            { jti: token.id },
                            { headers: { 'Authorization': SYSADMIN_API_TOKEN } }
                        );
                    } catch (revokeError) {
                        // Silently ignore revoke errors for individual tokens
                    }
                }
            }
        }
    } catch (error) {
        // Silently ignore cleanup errors - not critical for login
    }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        const CKAN_URL = getCkanUrl();

        // Step 0: FIRST check if user exists in CKAN before attempting login
        try {
            const userCheckResponse = await axiosInstance.get(`${CKAN_URL}/api/3/action/user_show`, {
                params: { id: username },
                headers: {
                    'Authorization': SYSADMIN_API_TOKEN
                }
            });

            if (!userCheckResponse.data.success) {
                return res.status(401).json({
                    success: false,
                    message: 'Akun tidak terdaftar. Silakan daftar terlebih dahulu.'
                });
            }
        } catch (userCheckError: any) {
            // If user_show fails with 404 or similar, user doesn't exist
            if (userCheckError.response?.status === 404 ||
                userCheckError.response?.data?.error?.message?.includes('Not Found')) {
                return res.status(401).json({
                    success: false,
                    message: 'Akun tidak terdaftar. Silakan daftar terlebih dahulu.'
                });
            }
            // For other errors, continue but log
            console.error('Error checking user existence:', userCheckError.message);
        }

        // Step 1: Verify credentials by attempting to log in to CKAN web interface
        const params = new URLSearchParams();
        params.append('login', username);
        params.append('password', password);

        const loginResponse = await axiosInstance.post(`${CKAN_URL}/login_generic`, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            maxRedirects: 0,
            validateStatus: (status) => status >= 200 && status < 500,
        });


        // Check if we got a redirect (302/303)
        if (loginResponse.status === 302 || loginResponse.status === 303) {
            const redirectLocation = loginResponse.headers.location || '';

            // CRITICAL: Check the __logins parameter in the redirect URL
            // CKAN uses /user/logged_in?__logins=X where X is the login attempt count
            // On SUCCESSFUL login: __logins stays at 0 or low
            // On FAILED login: CKAN typically redirects back to login page OR sets __logins > 0

            // Parse the redirect URL to check for failure indicators
            try {
                const redirectUrl = new URL(redirectLocation);
                const loginsParam = redirectUrl.searchParams.get('__logins');

                // If __logins parameter exists and is greater than 0, login failed
                if (loginsParam && parseInt(loginsParam, 10) > 0) {
                    return res.status(401).json({
                        success: false,
                        message: 'Username atau password salah.'
                    });
                }

                // Also check if redirecting back to login page
                if (redirectUrl.pathname.includes('/login') && !redirectUrl.pathname.includes('/logged_in')) {
                    return res.status(401).json({
                        success: false,
                        message: 'Username atau password salah.'
                    });
                }

                // Follow the redirect to verify authentication succeeded
                const setCookies = loginResponse.headers['set-cookie'] || [];
                const cookieString = Array.isArray(setCookies) ? setCookies.join('; ') : setCookies;

                // Make a follow-up request to logged_in endpoint to verify session
                const verifyResponse = await axiosInstance.get(redirectLocation, {
                    maxRedirects: 5,
                    validateStatus: (status) => status >= 200 && status < 500,
                    headers: {
                        'Cookie': cookieString
                    }
                });

                const responseData = typeof verifyResponse.data === 'string' ? verifyResponse.data : '';

                // Check if we ended up on login page or got an error
                if (responseData.includes('field-login') || responseData.includes('Login failed') || responseData.includes('Bad Credentials')) {
                    return res.status(401).json({
                        success: false,
                        message: 'Username atau password salah.'
                    });
                }

            } catch (urlError) {
                console.error('Error parsing redirect URL:', urlError);
                // If we can't parse, try a simple check
                if (redirectLocation.includes('/login') && !redirectLocation.includes('/logged_in')) {
                    return res.status(401).json({
                        success: false,
                        message: 'Username atau password salah.'
                    });
                }
            }

            // Login successful!

            // Step 2: Fetch user details and API Key using Sysadmin Token
            // We use a new axios instance or ensure headers are clean

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
                    try {
                        // Cleanup old frontend-login tokens before creating a new one
                        await cleanupOldFrontendTokens(username, CKAN_URL);

                        // Create new token
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

                // Check if user doesn't exist (404) or is unauthorized (403)
                if (userError.response?.status === 404 || userError.response?.status === 403) {
                    return res.status(401).json({
                        success: false,
                        message: 'Akun tidak ditemukan. Pengguna mungkin telah dihapus dari sistem.'
                    });
                }

                if (userError.code === 'ECONNRESET' || userError.message.includes('socket hang up')) {
                    return res.status(500).json({ success: false, message: 'Backend connection failed. Please try again.' });
                }

                // Generic error - could be user not found
                return res.status(401).json({
                    success: false,
                    message: 'Gagal mengambil data pengguna. Akun mungkin tidak ditemukan.'
                });
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
