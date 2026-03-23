import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Conversation from '@/app/models/Conversation';
import Message from '@/app/models/Message';
import User from '@/app/models/User';

export const dynamic = 'force-dynamic';

function normalizeParticipants(email1, email2) {
    return email1.toLowerCase() < email2.toLowerCase()
        ? [email1, email2]
        : [email2, email1];
}

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const userEmail = searchParams.get('user');
        const otherEmail = searchParams.get('other');

        if (!userEmail) {
            return NextResponse.json({ error: 'user email is required' }, { status: 400 });
        }

        if (otherEmail) {
            const [p1, p2] = normalizeParticipants(userEmail, otherEmail);
            const conv = await Conversation.findOne({ participant_one: p1, participant_two: p2 }).lean();

            if (!conv) {
                return NextResponse.json({ messages: [] });
            }

            const msgs = await Message.find({ conversation_id: conv._id }).sort({ createdAt: 1 }).lean();

            const formattedMsgs = msgs.map(m => ({
                id: m._id,
                from: m.sender_id,
                to: m.sender_id === userEmail ? otherEmail : userEmail,
                content: m.content,
                timestamp: m.createdAt
            }));

            return NextResponse.json({ messages: formattedMsgs });
        } else {
            try {
                const convs = await Conversation.find({
                    $or: [
                        { participant_one: userEmail },
                        { participant_two: userEmail }
                    ]
                }).sort({ updatedAt: -1 }).lean();

                const seen = new Set();
                const clients = [];

                for (const conv of convs) {
                    const isP1 = conv.participant_one === userEmail;
                    const partnerEmail = isP1 ? conv.participant_two : conv.participant_one;

                    if (seen.has(partnerEmail)) continue;
                    seen.add(partnerEmail);

                    const partnerUser = await User.findOne({ email: partnerEmail }).lean();

                    clients.push({
                        email: partnerEmail,
                        username: partnerUser?.name || 'User',
                        role: partnerUser?.role || 'user',
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

export async function POST(req) {
    try {
        await dbConnect();
        const { from, to, content } = await req.json();

        if (!from || !to || !content) {
            return NextResponse.json(
                { error: 'Missing required fields', received: { from, to, content } },
                { status: 400 }
            );
        }

        const [p1, p2] = normalizeParticipants(from, to);

        let conv = await Conversation.findOne({ participant_one: p1, participant_two: p2 });

        if (!conv) {
            conv = await Conversation.create({ participant_one: p1, participant_two: p2 });
        }

        const msg = await Message.create({
            conversation_id: conv._id,
            sender_id: from,
            content: content
        });

        // Update conv timestamp
        conv.updatedAt = new Date();
        await conv.save();

        const savedMessage = {
            id: msg._id,
            from: msg.sender_id,
            to: to,
            content: msg.content,
            timestamp: msg.createdAt
        };

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

export async function DELETE(req) {
    try {
        await dbConnect();
        const { userEmail, otherEmail } = await req.json();

        if (!userEmail || !otherEmail) {
            return NextResponse.json(
                { error: 'Both userEmail and otherEmail are required' },
                { status: 400 }
            );
        }

        const [p1, p2] = normalizeParticipants(userEmail, otherEmail);

        const conv = await Conversation.findOne({ participant_one: p1, participant_two: p2 });

        if (!conv) {
            return NextResponse.json({ error: 'No conversation found' }, { status: 404 });
        }

        await Message.deleteMany({ conversation_id: conv._id });
        await Conversation.deleteOne({ _id: conv._id });

        return NextResponse.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
    }
}
