import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Report ID is required' },
                { status: 400 }
            );
        }

        await query('DELETE FROM reports WHERE id = $1', [id]);

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
