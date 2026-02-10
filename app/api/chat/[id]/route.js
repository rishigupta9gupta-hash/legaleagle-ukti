import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

// GET: Get messages for a conversation
export async function GET(request, context) {
    try {
        const { id } = await context.params;

        const result = await query(
            `SELECT m.id, m.sender_id, m.content, m.created_at,
                    u.name as sender_name, u.role as sender_role
             FROM messages m
             LEFT JOIN users u ON m.sender_id = u.id
             WHERE m.conversation_id = $1
             ORDER BY m.created_at ASC`,
            [id]
        );

        // Also get conversation participants info
        const convResult = await query(
            `SELECT c.*, 
                    u1.name as p1_name, u1.role as p1_role, u1.phone as p1_phone, u1.specialization as p1_specialization,
                    u2.name as p2_name, u2.role as p2_role, u2.phone as p2_phone, u2.specialization as p2_specialization
             FROM conversations c
             LEFT JOIN users u1 ON c.participant_one = u1.id
             LEFT JOIN users u2 ON c.participant_two = u2.id
             WHERE c.id = $1`,
            [id]
        );

        return NextResponse.json({
            success: true,
            messages: result.rows,
            conversation: convResult.rows[0] || null
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

// POST: Send a message
export async function POST(request, context) {
    try {
        const { id } = await context.params;
        const { sender_id, content } = await request.json();

        if (!sender_id || !content) {
            return NextResponse.json(
                { success: false, message: 'sender_id and content are required' },
                { status: 400 }
            );
        }

        // Insert message
        const result = await query(
            `INSERT INTO messages (id, conversation_id, sender_id, content)
             VALUES (gen_random_uuid()::text, $1, $2, $3)
             RETURNING id, sender_id, content, created_at`,
            [id, sender_id, content]
        );

        // Update conversation timestamp
        await query(
            `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
            [id]
        );

        return NextResponse.json({
            success: true,
            message: result.rows[0]
        }, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to send message' },
            { status: 500 }
        );
    }
}
