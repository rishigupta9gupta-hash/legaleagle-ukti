import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/User';

export async function POST(request) {
    try {
        await dbConnect();
        const { doctorId } = await request.json();

        if (!doctorId) {
            return NextResponse.json({ success: false, message: 'Doctor ID is required' }, { status: 400 });
        }

        await User.deleteOne({ _id: doctorId, role: 'doctor' });

        return NextResponse.json({
            success: true,
            message: 'Doctor account deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting doctor:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to delete doctor' },
            { status: 500 }
        );
    }
}
