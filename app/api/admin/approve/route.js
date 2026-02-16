import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function POST(request) {
    try {
        const { doctorId } = await request.json();

        if (!doctorId) {
            return NextResponse.json({ success: false, message: 'Doctor ID is required' }, { status: 400 });
        }

        await query(
            `UPDATE users SET "isApproved" = true WHERE id = $1 AND role = 'doctor'`,
            [doctorId]
        );

        return NextResponse.json({
            success: true,
            message: 'Doctor approved successfully'
        });
    } catch (error) {
        console.error('Error approving doctor:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to approve doctor' },
            { status: 500 }
        );
    }
}
