import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { IncomingForm, File as FormidableFile } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import { getCkanUrl } from '@/lib/ckan';

// Sysadmin token for write operations (workaround for CKAN 2.11 JWT issue)
const SYSADMIN_API_TOKEN = process.env.SYSADMIN_API_TOKEN || '';

// Axios instance to prevent socket hang up
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 300000, // 5 minutes for large file uploads
});

export const config = {
    api: {
        bodyParser: false,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const userApiKey = req.headers.authorization;

    if (!userApiKey) {
        return res.status(401).json({ error: 'Unauthorized: API Key missing' });
    }

    if (!SYSADMIN_API_TOKEN) {
        return res.status(500).json({ error: 'Server configuration error: Missing sysadmin token' });
    }

    try {
        const form = new IncomingForm({
            maxFileSize: 1024 * 1024 * 1024, // 1GB for large GeoTIFF files
        });

        const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    reject(err);
                }
                resolve([fields, files]);
            });
        });

        const ckanUrl = getCkanUrl();
        const formData = new FormData();

        // Add fields
        Object.keys(fields).forEach(key => {
            const value = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
            formData.append(key, value);
        });

        // Add file
        const uploadFile = Array.isArray(files.upload) ? files.upload[0] : files.upload;

        if (uploadFile) {
            formData.append('upload', fs.createReadStream(uploadFile.filepath), {
                filename: uploadFile.originalFilename || 'file',
                contentType: uploadFile.mimetype || 'application/octet-stream',
            });
        }

        const response = await axiosInstance.post(
            `${ckanUrl}/api/3/action/resource_create`,
            formData,
            {
                headers: {
                    Authorization: SYSADMIN_API_TOKEN,
                    ...formData.getHeaders(),
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        return res.status(200).json(response.data);

    } catch (error: any) {
        console.error('[Resource Create] Error:', error.message);
        console.error('[Resource Create] Response data:', error.response?.data);
        console.error('[Resource Create] Response status:', error.response?.status);
        return res.status(error.response?.status || 500).json({
            error: 'Failed to create resource',
            details: error.response?.data?.error?.message || error.message,
            ckan_error: error.response?.data
        });
    }
}
