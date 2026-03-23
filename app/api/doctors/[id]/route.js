import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
    try {
        await dbConnect();
        const { id } = await context.params;

        const doctor = await User.findOne({ _id: id, role: 'doctor' }).select('id name email phone specialization experience_years bio avatar_url createdAt').lean();

        if (!doctor) {
            return NextResponse.json(
                { success: false, message: 'Doctor not found' },
                { status: 404 }
            );
        }

        doctor.created_at = doctor.createdAt;
        doctor.id = doctor._id;

        return NextResponse.json({
            success: true,
            doctor: doctor
        });
    } catch (error) {
        console.error('Error fetching doctor:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch doctor profile' },
            { status: 500 }
        );
    }
}
