import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let sql = `SELECT id, name, email, phone, specialization, experience_years, bio, "certificationUrl", "status", created_at 
             FROM users 
             WHERE role = 'doctor'`;

        const params = [];

        if (status) {
            sql += ` AND "status" = $1`;
            params.push(status);
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
