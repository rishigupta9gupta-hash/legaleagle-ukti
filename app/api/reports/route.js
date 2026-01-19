import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            );
        }

        const result = await query(
            'SELECT * FROM reports WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        return NextResponse.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, fileName, fileType, fileUrl, analysis, summary } = body;

        if (!userId || !fileName) {
            return NextResponse.json(
                { success: false, message: 'User ID and File Name are required' },
                { status: 400 }
            );
        }

        const result = await query(
            `INSERT INTO reports 
       (user_id, file_name, file_type, file_url, analysis, summary) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
            [userId, fileName, fileType, fileUrl, analysis, summary]
        );

        return NextResponse.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
