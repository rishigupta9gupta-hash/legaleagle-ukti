import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function POST(request) {
    try {
        const { doctorId } = await request.json();

        if (!doctorId) {
            return NextResponse.json({ success: false, message: 'Doctor ID is required' }, { status: 400 });
        }

        await query(
            `DELETE FROM users WHERE id = $1 AND role = 'doctor'`,
            [doctorId]
        );

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
