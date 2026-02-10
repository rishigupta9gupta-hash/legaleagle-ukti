import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function POST(request) {
    try {
        const { name, email, password, phone, specialization, experience_years, bio } = await request.json();

        if (!email || !password || !name || !specialization) {
            return NextResponse.json(
                { success: false, message: 'Name, email, password, and specialization are required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existing = await query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );

        if (existing.rows.length > 0) {
            return NextResponse.json(
                { success: false, message: 'An account with this email already exists' },
                { status: 409 }
            );
        }

        // Insert doctor user
        const result = await query(
            `INSERT INTO users (name, email, password, role, phone, specialization, experience_years, bio) 
             VALUES ($1, $2, $3, 'doctor', $4, $5, $6, $7) 
             RETURNING id, name, email, role, phone, specialization, experience_years, bio, created_at`,
            [name, email, password, phone || null, specialization, experience_years || 0, bio || null]
        );

        const newDoctor = result.rows[0];

        // Create default preferences
        await query(
            'INSERT INTO user_preferences (user_id) VALUES ($1)',
            [newDoctor.id]
        );

        return NextResponse.json({
            success: true,
            user: newDoctor,
            message: 'Doctor account created successfully'
        });

    } catch (error) {
        console.error('Doctor registration error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
