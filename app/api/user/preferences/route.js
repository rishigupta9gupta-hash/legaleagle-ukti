import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import UserPreference from '@/app/models/UserPreference';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
    }

    try {
        await dbConnect();
        const pref = await UserPreference.findOne({ user_id: userId }).lean();

        if (!pref) {
            return NextResponse.json({
                success: true,
                data: {
                    language: 'en',
                    conditions: [],
                    allergies: [],
                    reminder_enabled: true
                }
            });
        }

        pref.reminder_enabled = pref.reminderEnabled;
        return NextResponse.json({ success: true, data: pref });
    } catch (error) {
        console.error('Preferences GET Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        await dbConnect();
        const body = await request.json();
        const { userId, conditions, allergies, reminder_enabled, language } = body;

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        const reminderEnabled = reminder_enabled !== undefined ? reminder_enabled : true;

        await UserPreference.findOneAndUpdate(
            { user_id: userId },
            {
                user_id: userId,
                conditions: conditions || [],
                allergies: allergies || [],
                reminderEnabled: reminderEnabled,
                language: language || 'en'
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        return NextResponse.json({ success: true, message: 'Preferences updated' });
    } catch (error) {
        console.error('Preferences POST Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Error' }, { status: 500 });
    }
}
