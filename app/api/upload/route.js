import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const formData = await req.formData();
        const file = formData.get('file');
        const type = formData.get('type') || 'general'; // avatar, certification, general

        if (!file) {
            return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
        }

        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads', type);
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const ext = path.extname(file.name) || '.png';
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_').replace(ext, '');
        const filename = `${safeName}_${timestamp}${ext}`;

        // Write file to public/uploads/{type}/
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filePath = path.join(uploadsDir, filename);
        await writeFile(filePath, buffer);

        // Return the public URL path (stored in DB)
        const publicPath = `/uploads/${type}/${filename}`;

        return NextResponse.json({
            success: true,
            url: publicPath,
            filename: filename,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to upload file', details: error.message },
            { status: 500 }
        );
    }
}
