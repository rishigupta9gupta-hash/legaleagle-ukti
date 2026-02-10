import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Query user from database
        const result = await query(
            'SELECT id, name, email, password, role, phone, specialization, created_at FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 401 }
            );
        }

        // In a real app, use bcrypt.compare(password, user.password)
        // For this prototype (based on "js only" request), we'll do simple comparison
        // Assuming passwords in DB are stored directly or we add bcrypt later
        if (user.password !== password) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Return user info (excluding password)
        const { password: _, ...userWithoutPassword } = user;

        return NextResponse.json({
            success: true,
            user: userWithoutPassword,
            message: 'Login successful'
        });

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
