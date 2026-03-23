import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import UserPreference from '@/app/models/UserPreference';
import { SignJWT } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

export async function POST(request) {
    try {
        await dbConnect();
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
        let user = await User.findOne({ email });

        if (!user) {
            // Create user
            user = await User.create({ email, name, role: 'user' });

            // Create default preferences
            await UserPreference.create({ user_id: user._id });
        }

        // Generate JWT Token (same as login route)
        const secret = new TextEncoder().encode(JWT_SECRET);
        const jwtToken = await new SignJWT({
            id: user._id.toString(),
            email: user.email,
            role: user.role || 'user',
            isAdmin: user.isAdmin || false
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setExpirationTime('24h')
            .sign(secret);

        // Create response
        const response = NextResponse.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role || 'user',
                isAdmin: user.isAdmin || false
            },
            message: 'Google login successful'
        });

        // Set HTTP-only cookie (same as login route)
        response.cookies.set({
            name: 'token',
            value: jwtToken,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24,
            path: '/',
        });

        return response;

    } catch (error) {
        console.error('Google Auth Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
