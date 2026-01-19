import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function POST(request) {
    try {
        const { token } = await request.json();

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Token is required' },
                { status: 400 }
            );
        }

        // Verify Google Token
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        const googleData = await googleRes.json();

        if (googleData.error || !googleData.email) {
            return NextResponse.json(
                { success: false, message: 'Invalid Google Token' },
                { status: 401 }
            );
        }

        const { email, name, sub: googleId } = googleData;

        // Check if user exists
        const existingUser = await query('SELECT * FROM users WHERE email = $1', [email]);
        let user;

        if (existingUser.rows.length > 0) {
            user = existingUser.rows[0];
            // Ideally update name or google_id if needed
        } else {
            // Create user
            // Note: Password is NULL for Google users
            const result = await query(
                `INSERT INTO users (email, name) VALUES ($1, $2) RETURNING *`,
                [email, name]
            );
            user = result.rows[0];

            // Create default preferences
            await query(
                `INSERT INTO user_preferences (user_id) VALUES ($1)`,
                [user.id]
            );
        }

        // Return user data (matching login response)
        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            },
            message: 'Google login successful'
        });

    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
