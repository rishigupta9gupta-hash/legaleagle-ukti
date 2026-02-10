import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

// GET: Fetch full profile by email
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
        console.error('Error fetching profile:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
    }
}

// PUT: Update user profile
export async function PUT(req) {
    try {
        const body = await req.json();
        const { email, name, phone, bio, avatar_url, specialization, experience_years } = body;

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        // Build dynamic update query
        const fields = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) { fields.push(`name = $${paramIndex++}`); values.push(name); }
        if (phone !== undefined) { fields.push(`phone = $${paramIndex++}`); values.push(phone); }
        if (bio !== undefined) { fields.push(`bio = $${paramIndex++}`); values.push(bio); }
        if (avatar_url !== undefined) { fields.push(`avatar_url = $${paramIndex++}`); values.push(avatar_url); }
        if (specialization !== undefined) { fields.push(`specialization = $${paramIndex++}`); values.push(specialization); }
        if (experience_years !== undefined) { fields.push(`experience_years = $${paramIndex++}`); values.push(experience_years); }

        if (fields.length === 0) {
            return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 });
        }

        values.push(email);
        const sql = `UPDATE users SET ${fields.join(', ')} WHERE email = $${paramIndex} RETURNING id, name, email, role, phone, specialization, experience_years, bio, avatar_url`;

        const result = await query(sql, values);

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            user: result.rows[0],
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 });
    }
}
