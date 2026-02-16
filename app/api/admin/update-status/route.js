import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function POST(request) {
    try {
        const { doctorId, status } = await request.json();

        if (!doctorId || !status) {
            return NextResponse.json({ success: false, message: 'Doctor ID and status are required' }, { status: 400 });
        }

        const validStatuses = ['PENDING', 'APPROVED', 'SUSPENDED', 'BANNED'];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
        }

        // Sync isApproved for backward compatibility
        const isApproved = status === 'APPROVED';

        await query(
            `UPDATE users SET "status" = $1, "isApproved" = $2 WHERE id = $3 AND role = 'doctor'`,
            [status, isApproved, doctorId]
        );

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
