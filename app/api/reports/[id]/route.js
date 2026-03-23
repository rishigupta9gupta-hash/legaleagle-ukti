import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Report from '@/app/models/Report';

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Report ID is required' },
                { status: 400 }
            );
        }

        await Report.findByIdAndDelete(id);

        return NextResponse.json({
            success: true,
            message: 'Report deleted successfully'
        });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
