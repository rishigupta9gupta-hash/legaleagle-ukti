import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

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
            'SELECT id, name, email, password, role, phone, specialization, "isAdmin", avatar_url FROM users WHERE email = $1',
            [email]
        );

        const user = result.rows[0];

        if (!user) {
            return NextResponse.json(
                { success: false, message: 'User not found' },
                { status: 401 }
            );
        }

        // Simple password comparison (in production use bcrypt)
        if (user.password !== password) {
            return NextResponse.json(
                { success: false, message: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Return user info (excluding password)
        const { password: _, ...userWithoutPassword } = user;

        // Generate JWT Token
        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({
            id: user.id,
            email: user.email,
            role: user.role,
            isAdmin: user.isAdmin
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret);

        // Create response
        const response = NextResponse.json({
            success: true,
            user: userWithoutPassword,
            message: 'Login successful'
        });

        // Set HTTP-only cookie
        response.cookies.set({
            name: 'token',
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
