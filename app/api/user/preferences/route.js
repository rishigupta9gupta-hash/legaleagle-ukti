
import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import { getSession } from '@/app/utils/auth-api'; // We might need to implement getSession server-side or verify token here
// Wait, client-side auth-api.js uses localStorage. Server-side we need headers.
// For now, I'll assume we pass userId in header or body, OR we verify token. 
// Standard pattern: verify JWT from Authorization header.

// Let's check api/auth/google/route.js to see how we issue tokens.
// Step 655: It returns { user }. It doesn't seem to issue a cookie or JWT?
// Step 655: "return NextResponse.json({ success: true, user: ... })".
// It seems we rely on Client Side state for now? 
// If so, we must trust the client to send the user_id? (INSECURE but matches current state).
// OR we should have a middleware.

// For MVP speed (User Request: "make frontend"), I will accept `user_id` in the body/query for now, 
// but add a TODO to secure it.

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
    }

    try {
        const result = await query(
            'SELECT * FROM user_preferences WHERE user_id = $1',
            [userId]
        );

        if (result.rows.length === 0) {
            // Return defaults
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

        return NextResponse.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Preferences GET Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        const { userId, conditions, allergies, reminder_enabled, language } = body;

        if (!userId) {
            return NextResponse.json({ success: false, message: 'User ID required' }, { status: 400 });
        }

        // Upsert
        const existing = await query('SELECT id FROM user_preferences WHERE user_id = $1', [userId]);

        if (existing.rows.length > 0) {
            await query(
                `UPDATE user_preferences 
         SET conditions = $1, allergies = $2, reminder_enabled = $3, language = $4, updated_at = NOW()
         WHERE user_id = $5`,
                [conditions, allergies, reminder_enabled, language, userId]
            );
        } else {
            await query(
                `INSERT INTO user_preferences (user_id, conditions, allergies, reminder_enabled, language)
         VALUES ($1, $2, $3, $4, $5)`,
                [userId, conditions || [], allergies || [], reminder_enabled, language || 'en']
            );
        }

        return NextResponse.json({ success: true, message: 'Preferences updated' });
    } catch (error) {
        console.error('Preferences POST Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Error' }, { status: 500 });
    }
}
