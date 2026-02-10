import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
    try {
        const { id } = await context.params;

        const result = await query(
            `SELECT id, name, email, phone, specialization, experience_years, bio, avatar_url, created_at 
             FROM users WHERE id::text = $1 AND role = 'doctor'`,
            [String(id)]
        );

        if (result.rows.length === 0) {
            return NextResponse.json(
                { success: false, message: 'Doctor not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            doctor: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching doctor:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch doctor profile' },
            { status: 500 }
        );
    }
}
