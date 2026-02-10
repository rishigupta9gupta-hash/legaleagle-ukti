import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

export const dynamic = 'force-dynamic';

// Helper: normalize participant order so (A,B) and (B,A) always become the same pair
function normalizeParticipants(email1, email2) {
    return email1.toLowerCase() < email2.toLowerCase()
        ? [email1, email2]
        : [email2, email1];
}

// GET: Fetch conversations or messages
// ?user=email -> list all chat partners for this user
// ?user=email&other=email -> get messages between two users
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const userEmail = searchParams.get('user');
        const otherEmail = searchParams.get('other');

        if (!userEmail) {
            return NextResponse.json({ error: 'user email is required' }, { status: 400 });
        }

        if (otherEmail) {
            // Fetch messages between two users (normalize to find conversation)
            const [p1, p2] = normalizeParticipants(userEmail, otherEmail);
            const conv = await query(
                `SELECT id FROM conversations 
                 WHERE participant_one = $1 AND participant_two = $2`,
                [p1, p2]
            );

            if (conv.rows.length === 0) {
                return NextResponse.json({ messages: [] });
            }

            const convId = conv.rows[0].id;
            const msgs = await query(
                `SELECT id, sender_id as "from", 
                        CASE WHEN sender_id = $1 THEN $2 ELSE $1 END as "to",
                        content, created_at as timestamp
                 FROM messages 
                 WHERE conversation_id = $3 
                 ORDER BY created_at ASC`,
                [userEmail, otherEmail, convId]
            );

            return NextResponse.json({ messages: msgs.rows });
        } else {
            // Fetch all chat partners for this user
            try {
                const convs = await query(
                    `SELECT c.id, c.participant_one, c.participant_two, c.updated_at,
                            u1.name as p1_name, u1.role as p1_role, 
                            u2.name as p2_name, u2.role as p2_role
                     FROM conversations c
                     LEFT JOIN users u1 ON u1.email = c.participant_one
                     LEFT JOIN users u2 ON u2.email = c.participant_two
                     WHERE c.participant_one = $1 OR c.participant_two = $1
                     ORDER BY c.updated_at DESC`,
                    [userEmail]
                );

                // Deduplicate by partner email (take the most recent conversation)
                const seen = new Set();
                const clients = [];
                for (const conv of convs.rows) {
                    const isP1 = conv.participant_one === userEmail;
                    const partnerEmail = isP1 ? conv.participant_two : conv.participant_one;

                    if (seen.has(partnerEmail)) continue;
                    seen.add(partnerEmail);

                    clients.push({
                        email: partnerEmail,
                        username: isP1 ? (conv.p2_name || 'User') : (conv.p1_name || 'User'),
                        role: isP1 ? conv.p2_role : conv.p1_role,
                    });
                }

                return NextResponse.json({ clients });
            } catch (joinError) {
                console.error('Error in chat partners query:', joinError);
                return NextResponse.json({ clients: [] });
            }
        }
    } catch (error) {
        console.error('Error fetching chat data:', error);
        return NextResponse.json({ clients: [] });
    }
}

// POST: Send a message (auto-create conversation if needed)
export async function POST(req) {
    try {
        const { from, to, content } = await req.json();

        if (!from || !to || !content) {
            return NextResponse.json(
                { error: 'Missing required fields', received: { from, to, content } },
                { status: 400 }
            );
        }

        // Normalize participant order so we never create duplicates
        const [p1, p2] = normalizeParticipants(from, to);

        // Find or create conversation using normalized order
        let conv = await query(
            `SELECT id FROM conversations 
             WHERE participant_one = $1 AND participant_two = $2`,
            [p1, p2]
        );

        let convId;
        if (conv.rows.length === 0) {
            const newConv = await query(
                `INSERT INTO conversations (id, participant_one, participant_two) 
                 VALUES (gen_random_uuid()::text, $1, $2) 
                 RETURNING id`,
                [p1, p2]
            );
            convId = newConv.rows[0].id;
        } else {
            convId = conv.rows[0].id;
        }

        // Insert message (sender_id is always the original 'from')
        const msgResult = await query(
            `INSERT INTO messages (id, conversation_id, sender_id, content) 
             VALUES (gen_random_uuid()::text, $1, $2, $3) 
             RETURNING id, sender_id as "from", content, created_at as timestamp`,
            [convId, from, content]
        );

        // Update conversation timestamp
        await query(`UPDATE conversations SET updated_at = NOW() WHERE id = $1`, [convId]);

        const savedMessage = { ...msgResult.rows[0], to };

        return NextResponse.json(
            { message: 'Message saved successfully', savedMessage },
            { status: 201 }
        );
    } catch (error) {
        console.error('Error saving message:', error);
        return NextResponse.json(
            { error: 'Failed to save message', details: error.message },
            { status: 500 }
        );
    }
}

// DELETE: Delete a conversation
export async function DELETE(req) {
    try {
        const { userEmail, otherEmail } = await req.json();

        if (!userEmail || !otherEmail) {
            return NextResponse.json(
                { error: 'Both userEmail and otherEmail are required' },
                { status: 400 }
            );
        }

        // Normalize to find the conversation
        const [p1, p2] = normalizeParticipants(userEmail, otherEmail);

        const conv = await query(
            `SELECT id FROM conversations 
             WHERE participant_one = $1 AND participant_two = $2`,
            [p1, p2]
        );

        if (conv.rows.length === 0) {
            return NextResponse.json({ error: 'No conversation found' }, { status: 404 });
        }

        await query(`DELETE FROM messages WHERE conversation_id = $1`, [conv.rows[0].id]);
        await query(`DELETE FROM conversations WHERE id = $1`, [conv.rows[0].id]);

        return NextResponse.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }
}
