import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Medication from '@/app/models/Medication';

export async function DELETE(request, { params }) {
    try {
        await dbConnect();
        const { id } = params;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Medication ID is required' },
                { status: 400 }
            );
        }

        await Medication.findByIdAndDelete(id);

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
        await dbConnect();
        const { id } = params;
        const body = await request.json();
        const { takenDates } = body;

        if (!id) {
            return NextResponse.json(
                { success: false, message: 'Medication ID is required' },
                { status: 400 }
            );
        }

        if (takenDates) {
            const updatedMed = await Medication.findByIdAndUpdate(
                id,
                { $set: { takenDates } },
                { new: true }
            ).lean();
            
            updatedMed.created_at = updatedMed.createdAt;
            updatedMed.expiry_date = updatedMed.expiryDate;
            updatedMed.image_url = updatedMed.imageUrl;
            updatedMed.taken_dates = updatedMed.takenDates;
            updatedMed.id = updatedMed._id;

            return NextResponse.json({
                success: true,
                data: updatedMed
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
