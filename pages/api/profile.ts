import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { getCkanUrl } from '@/lib/ckan';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { action, userId } = req.query;
    const apiKey = req.headers.authorization;

    if (!apiKey) {
        return res.status(401).json({ error: 'API key required' });
    }

    if (!action || typeof action !== 'string') {
        return res.status(400).json({ error: 'Action parameter required' });
    }

    const ckanUrl = getCkanUrl();

    try {
        switch (action) {
            case 'activities': {
                // Fetch dashboard activities
                const activitiesRes = await axios.get(`${ckanUrl}/api/3/action/dashboard_activity_list`, {
                    headers: { Authorization: apiKey }
                });
                const activitiesData = activitiesRes.data.result.slice(0, 20);

                // Fetch username for each activity
                const activitiesWithUsernames = await Promise.all(
                    activitiesData.map(async (activity: any) => {
                        try {
                            const userResponse = await axios.get(
                                `${ckanUrl}/api/3/action/user_show?id=${activity.user_id}`,
                                { headers: { Authorization: apiKey } }
                            );
                            return {
                                ...activity,
                                username: userResponse.data.result.name ||
                                    userResponse.data.result.display_name ||
                                    activity.user_id
                            };
                        } catch (error) {
                            console.error('Error fetching user:', error);
                            return {
                                ...activity,
                                username: activity.user_id
                            };
                        }
                    })
                );

                return res.status(200).json({ success: true, result: activitiesWithUsernames });
            }

            case 'datasets': {
                if (!userId || typeof userId !== 'string') {
                    return res.status(400).json({ error: 'userId parameter required for datasets action' });
                }

                const fq = `creator_user_id:${userId}`;
                const datasetsRes = await axios.get(`${ckanUrl}/api/3/action/package_search`, {
                    params: {
                        rows: 100,
                        include_private: true,
                        fq: fq
                    },
                    headers: { Authorization: apiKey }
                });

                return res.status(200).json({ success: true, result: datasetsRes.data.result.results });
            }

            case 'organizations': {
                // Fetch user's organizations
                const orgsRes = await axios.get(`${ckanUrl}/api/3/action/organization_list_for_user`, {
                    params: { permission: 'read' },
                    headers: { Authorization: apiKey }
                });

                const orgs = orgsRes.data.result;

                // Fetch accurate counts for each organization
                const orgsWithCounts = await Promise.all(
                    orgs.map(async (org: any) => {
                        try {
                            const countResponse = await axios.get(`${ckanUrl}/api/3/action/package_search`, {
                                params: {
                                    q: `organization:${org.name}`,
                                    rows: 0,
                                    include_private: true
                                },
                                headers: { Authorization: apiKey }
                            });
                            return { ...org, package_count: countResponse.data.result.count };
                        } catch (e) {
                            console.error(`Error fetching count for org ${org.name}`, e);
                            return org;
                        }
                    })
                );

                return res.status(200).json({ success: true, result: orgsWithCounts });
            }

            case 'groups': {
                const groupsRes = await axios.get(`${ckanUrl}/api/3/action/group_list_authz`, {
                    headers: { Authorization: apiKey }
                });

                return res.status(200).json({ success: true, result: groupsRes.data.result });
            }

            case 'user': {
                if (!userId || typeof userId !== 'string') {
                    return res.status(400).json({ error: 'userId parameter required for user action' });
                }

                const userRes = await axios.get(`${ckanUrl}/api/3/action/user_show`, {
                    params: { id: userId },
                    headers: { Authorization: apiKey }
                });

                return res.status(200).json({ success: true, result: userRes.data.result });
            }

            case 'users': {
                // Batch fetch multiple users - userId should be comma-separated
                if (!userId || typeof userId !== 'string') {
                    return res.status(400).json({ error: 'userId parameter required for users action' });
                }

                const userIds = userId.split(',').filter(Boolean);

                if (userIds.length === 0) {
                    return res.status(400).json({ error: 'No valid user IDs provided' });
                }

                // Fetch all users in parallel
                const usersData = await Promise.all(
                    userIds.map(async (id) => {
                        try {
                            const userRes = await axios.get(`${ckanUrl}/api/3/action/user_show`, {
                                params: { id: id.trim() },
                                headers: { Authorization: apiKey }
                            });
                            return { id: id.trim(), user: userRes.data.result };
                        } catch (error) {
                            console.error(`Error fetching user ${id}:`, error);
                            return { id: id.trim(), user: null };
                        }
                    })
                );

                return res.status(200).json({ success: true, result: usersData });
            }

            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }
    } catch (error: any) {
        console.error(`Error in profile API (action: ${action}):`, error.response?.data || error.message);
        return res.status(500).json({
            error: 'Failed to fetch profile data',
            details: error.response?.data?.error?.message || error.message
        });
    }
}
