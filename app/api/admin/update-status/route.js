import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/User';

export async function POST(request) {
    try {
        await dbConnect();
        const { doctorId, status } = await request.json();

        if (!doctorId || !status) {
            return NextResponse.json({ success: false, message: 'Doctor ID and status are required' }, { status: 400 });
        }

        const validStatuses = ['PENDING', 'APPROVED', 'SUSPENDED', 'BANNED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
        }

        const isApproved = status === 'APPROVED';

        const updatedUser = await User.findOneAndUpdate(
            { _id: doctorId, role: 'doctor' },
            { $set: { status, isApproved } }
        );

        if (!updatedUser) {
            return NextResponse.json({ success: false, message: 'Doctor not found or not a doctor role' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: `Doctor status updated to ${status}`
        });
    } catch (error) {
        console.error('Error updating status:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to update status' },
            { status: 500 }
        );
    }
}
