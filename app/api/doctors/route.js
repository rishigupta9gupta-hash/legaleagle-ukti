import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const specialization = searchParams.get('specialization');

        let sql = `SELECT id, name, email, phone, specialization, experience_years, bio, avatar_url, created_at 
                    FROM users WHERE role = 'doctor'`;
        const params = [];

        if (specialization) {
            sql += ` AND specialization = $1`;
            params.push(specialization);
        }

        sql += ` ORDER BY created_at DESC`;

        const result = await query(sql, params);

        return NextResponse.json({
            success: true,
            doctors: result.rows
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch doctors' },
            { status: 500 }
        );
    }
}
