import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import UserPreference from '@/app/models/UserPreference';

export async function POST(request) {
    try {
        await dbConnect();
        const { name, email, password, phone, specialization, experience_years, bio, certificationUrl } = await request.json();

        if (!email || !password || !name || !specialization) {
            return NextResponse.json(
                { success: false, message: 'Name, email, password, and specialization are required' },
                { status: 400 }
            );
        }

        // Check if user exists
        const existing = await User.findOne({ email });

        if (existing) {
            return NextResponse.json(
                { success: false, message: 'An account with this email already exists' },
                { status: 409 }
            );
        }

        // Insert doctor user
        const newDoctor = await User.create({
            name,
            email,
            password,
            role: 'doctor',
            phone: phone || null,
            specialization,
            experience_years: experience_years || 0,
            bio: bio || null,
            isApproved: false,
            certificationUrl: certificationUrl || null,
            status: 'PENDING'
        });

        // Create default preferences
        await UserPreference.create({ user_id: newDoctor._id });

        return NextResponse.json({
            success: true,
            user: {
                id: newDoctor._id,
                name: newDoctor.name,
                email: newDoctor.email,
                role: newDoctor.role,
                phone: newDoctor.phone,
                specialization: newDoctor.specialization,
                experience_years: newDoctor.experience_years,
                bio: newDoctor.bio,
                isApproved: newDoctor.isApproved,
                status: newDoctor.status,
                created_at: newDoctor.createdAt
            },
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
