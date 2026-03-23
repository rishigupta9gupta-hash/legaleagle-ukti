import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import UserPreference from '@/app/models/UserPreference';

export async function POST(request) {
    try {
        await dbConnect();
        const { name, email, password } = await request.json();

        if (!email || !password || !name) {
            return NextResponse.json(
                { success: false, message: 'All fields are required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existing = await User.findOne({ email });

        if (existing) {
            return NextResponse.json(
                { success: false, message: 'User with this email already exists' },
                { status: 409 }
            );
        }

        // Insert user
        // Note: In real app, hash password here using bcrypt
        const newUser = await User.create({ name, email, password, role: 'user' });

        // Create default preferences
        await UserPreference.create({ user_id: newUser._id });

        return NextResponse.json({
            success: true,
            user: { id: newUser._id, name: newUser.name, email: newUser.email, created_at: newUser.createdAt },
            message: 'Account created successfully'
        });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
