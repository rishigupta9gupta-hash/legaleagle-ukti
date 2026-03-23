import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Medication from '@/app/models/Medication';

export async function GET(request) {
    try {
        await dbConnect();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            );
        }

        const meds = await Medication.find({ user_id: userId }).sort({ createdAt: -1 }).lean();

        const mappedMeds = meds.map(m => ({
            ...m,
            created_at: m.createdAt,
            expiry_date: m.expiryDate,
            image_url: m.imageUrl,
            taken_dates: m.takenDates,
            id: m._id
        }));

        return NextResponse.json({
            success: true,
            data: mappedMeds
        });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { userId, name, dosage, frequency, time, expiryDate, notes, imageUrl } = body;

        if (!userId || !name) {
            return NextResponse.json(
                { success: false, message: 'User ID and Name are required' },
                { status: 400 }
            );
        }

        const newMed = await Medication.create({
            user_id: userId,
            name,
            dosage,
            frequency,
            time,
            expiryDate,
            notes,
            imageUrl
        });

        const medData = newMed.toObject();
        medData.created_at = medData.createdAt;
        medData.expiry_date = medData.expiryDate;
        medData.image_url = medData.imageUrl;
        medData.taken_dates = medData.takenDates;
        medData.id = medData._id;

        return NextResponse.json({
            success: true,
            data: medData
        });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
