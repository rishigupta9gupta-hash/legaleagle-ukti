import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Medication ID is required' },
                { status: 400 }
            );
        }

        await query('DELETE FROM medications WHERE id = $1', [id]);

        return NextResponse.json({
            success: true,
            message: 'Medication deleted successfully'
        });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function PATCH(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { takenDates } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Medication ID is required' },
                { status: 400 }
            );
        }

        // Currently only supporting updating 'takenDates' for the tracker
        if (takenDates) {
            const result = await query(
                'UPDATE medications SET taken_dates = $1 WHERE id = $2 RETURNING *',
                [takenDates, id]
            );

            return NextResponse.json({
                success: true,
                data: result.rows[0]
            });
        }

        return NextResponse.json(
            { success: false, message: 'No valid fields to update' },
            { status: 400 }
        );

    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
