import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import http from 'http';
import { IncomingForm, File as FormidableFile } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import { getCkanUrl } from '@/lib/ckan';

// Axios instance to prevent socket hang up
const axiosInstance = axios.create({
    httpAgent: new http.Agent({ keepAlive: false }),
    timeout: 60000, // 60s for file uploads
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

    const apiKey = req.headers.authorization;

    if (!apiKey) {
        return res.status(401).json({ error: 'Unauthorized: API Key missing' });
    }

    try {
        const form = new IncomingForm();

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
                    Authorization: apiKey,
                    ...formData.getHeaders(),
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
            }
        );

        return res.status(200).json(response.data);

    } catch (error: any) {
        return res.status(error.response?.status || 500).json({
            error: 'Failed to create resource',
            details: error.response?.data?.error?.message || error.message
        });
    }
}
