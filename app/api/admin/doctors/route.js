import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const query = { role: 'doctor' };
        if (status) {
            query.status = status;
        }

        const doctors = await User.find(query)
            .select('id name email phone specialization experience_years bio certificationUrl status createdAt')
            .sort({ createdAt: -1 })
            .lean();

        const formattedDoctors = doctors.map(d => {
            d.created_at = d.createdAt;
            d.id = d._id;
            return d;
        });

        return NextResponse.json({
            success: true,
            doctors: formattedDoctors
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch doctors' },
            { status: 500 }
        );
    }
}
