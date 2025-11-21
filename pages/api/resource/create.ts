import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { IncomingForm, File as FormidableFile } from 'formidable';
import fs from 'fs';
import FormData from 'form-data';
import { getCkanUrl } from '@/lib/ckan';

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
        console.log('[Resource Create Proxy] Parsing form data...');
        const form = new IncomingForm();

        const [fields, files] = await new Promise<[any, any]>((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) {
                    console.error('[Resource Create Proxy] Form parse error:', err);
                    reject(err);
                }
                resolve([fields, files]);
            });
        });

        console.log('[Resource Create Proxy] Fields received:', Object.keys(fields));
        console.log('[Resource Create Proxy] Files received:', Object.keys(files));

        const ckanUrl = getCkanUrl();
        const formData = new FormData();

        // Add fields
        Object.keys(fields).forEach(key => {
            // Handle array fields if any (formidable might return arrays)
            const value = Array.isArray(fields[key]) ? fields[key][0] : fields[key];
            formData.append(key, value);
        });

        // Add file
        // Formidable v3+ structure might vary, but usually files.upload is an array or object
        const uploadFile = Array.isArray(files.upload) ? files.upload[0] : files.upload;

        if (uploadFile) {
            console.log('[Resource Create Proxy] Processing file:', {
                name: uploadFile.originalFilename,
                path: uploadFile.filepath,
                size: uploadFile.size,
                type: uploadFile.mimetype
            });

            formData.append('upload', fs.createReadStream(uploadFile.filepath), {
                filename: uploadFile.originalFilename || 'file',
                contentType: uploadFile.mimetype || 'application/octet-stream',
            });
        } else {
            console.warn('[Resource Create Proxy] No file found in request');
        }

        console.log('[Resource Create Proxy] Uploading resource to:', `${ckanUrl}/api/3/action/resource_create`);

        const response = await axios.post(
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

        console.log('[Resource Create Proxy] CKAN Response Status:', response.status);
        console.log('[Resource Create Proxy] CKAN Response Data Success:', response.data?.success);

        return res.status(200).json(response.data);

    } catch (error: any) {
        console.error('[Resource Create Proxy] Error creating resource:', error.response?.data || error.message);
        if (error.response) {
            console.error('[Resource Create Proxy] CKAN Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        return res.status(error.response?.status || 500).json({
            error: 'Failed to create resource',
            details: error.response?.data?.error?.message || error.message
        });
    }
}
