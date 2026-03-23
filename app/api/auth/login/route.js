import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(request) {
    try {
        await dbConnect();
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Query user from database
        const user = await User.findOne({ email }).lean();

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

        if (user.role === 'doctor' && user.status !== 'APPROVED') {
            let message = 'Your account is pending approval.';
            if (user.status === 'SUSPENDED') message = 'Your account has been suspended.';
            if (user.status === 'BANNED') message = 'Your account has been banned.';

            return NextResponse.json(
                { success: false, message },
                { status: 403 }
            );
        }

        // Return user info (excluding password)
        const { password: _, _id, ...userWithoutPassword } = user;
        userWithoutPassword.id = _id?.toString() || user.id;

        // Generate JWT Token
        const secret = new TextEncoder().encode(JWT_SECRET);
        const token = await new SignJWT({
            id: userWithoutPassword.id,
            email: userWithoutPassword.email,
            role: userWithoutPassword.role,
            isAdmin: userWithoutPassword.isAdmin
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
