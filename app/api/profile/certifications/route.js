import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

// GET: List certifications for a doctor
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const result = await query(
            `SELECT id, title, file_url, file_type, created_at
             FROM certifications WHERE user_email = $1
             ORDER BY created_at DESC`,
            [email]
        );

        return NextResponse.json({ success: true, certifications: result.rows });
    } catch (error) {
        console.error('Error fetching certifications:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch certifications' }, { status: 500 });
    }
}

// POST: Add a new certification
export async function POST(req) {
    try {
        const { email, title, file_url, file_type } = await req.json();

        if (!email || !title || !file_url) {
            return NextResponse.json(
                { success: false, error: 'Email, title, and file_url are required' },
                { status: 400 }
            );
        }

        const result = await query(
            `INSERT INTO certifications (id, user_email, title, file_url, file_type)
             VALUES (gen_random_uuid()::text, $1, $2, $3, $4)
             RETURNING id, title, file_url, file_type, created_at`,
            [email, title, file_url, file_type || 'image']
        );

        return NextResponse.json({
            success: true,
            certification: result.rows[0],
            message: 'Certification added successfully'
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding certification:', error);
        return NextResponse.json({ success: false, error: 'Failed to add certification' }, { status: 500 });
    }
}

// DELETE: Remove a certification
export async function DELETE(req) {
    try {
        const { id, email } = await req.json();

        if (!id || !email) {
            return NextResponse.json(
                { success: false, error: 'Certification ID and email are required' },
                { status: 400 }
            );
        }

        const result = await query(
            `DELETE FROM certifications WHERE id = $1 AND user_email = $2 RETURNING id`,
            [id, email]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ success: false, error: 'Certification not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Certification deleted' });
    } catch (error) {
        console.error('Error deleting certification:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete certification' }, { status: 500 });
    }
}
