import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request) {
    try {
        const data = await request.formData();
        const file = data.get('file');

        if (!file) {
            return NextResponse.json({ success: false, message: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Convert to Base64
        const mimeType = file.type || 'application/octet-stream';
        const base64String = `data:${mimeType};base64,${buffer.toString('base64')}`;

        return NextResponse.json({ success: true, url: base64String });
    } catch (error) {
        console.error('Upload Error Details:', error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || 'File upload failed. Server error.'
            },
            { status: 500 }
        );
    }
}
