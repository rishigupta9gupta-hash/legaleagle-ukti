import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch user info by email
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const result = await query(
            `SELECT id, name, email, role, phone, specialization, experience_years, bio, avatar_url, created_at 
             FROM users WHERE email = $1`,
            [email]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch user' }, { status: 500 });
    }
}
