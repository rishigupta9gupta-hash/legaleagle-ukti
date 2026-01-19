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
            'SELECT * FROM health_sessions WHERE user_id = $1 ORDER BY created_at DESC',
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
        const {
            userId,
            duration,
            transcript,
            summary,
            severity,
            recommendations,
            mode = 'medical',
            language = 'en'
        } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            );
        }

        const result = await query(
            `INSERT INTO health_sessions 
       (user_id, duration, transcript, summary, severity, recommendations, mode, language) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
            [
                userId,
                duration || 0,
                JSON.stringify(transcript || []),
                summary || '',
                severity || 'low',
                recommendations || [],
                mode,
                language
            ]
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
