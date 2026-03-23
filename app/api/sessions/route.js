import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import HealthSession from '@/app/models/HealthSession';

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

        const sessions = await HealthSession.find({ user_id: userId }).sort({ createdAt: -1 }).lean();

        const mappedSessions = sessions.map(s => ({
            ...s,
            created_at: s.createdAt,
            id: s._id
        }));

        return NextResponse.json({
            success: true,
            data: mappedSessions
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
        const {
            userId,
            duration,
            transcript,
            summary,
            severity,
            recommendations,
            mode = 'medical',
            language = 'en'
        } = body;

        if (!userId) {
            return NextResponse.json(
                { success: false, message: 'User ID is required' },
                { status: 400 }
            );
        }

        const newSession = await HealthSession.create({
            user_id: userId,
            duration: duration || 0,
            transcript: transcript || [],
            summary: summary || '',
            severity: severity || 'low',
            recommendations: recommendations || [],
            mode,
            language
        });

        const sessionData = newSession.toObject();
        sessionData.created_at = sessionData.createdAt;

        return NextResponse.json({
            success: true,
            data: sessionData
        });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
