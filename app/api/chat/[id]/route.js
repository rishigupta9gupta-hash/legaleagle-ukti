import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Conversation from '@/app/models/Conversation';
import Message from '@/app/models/Message';
import User from '@/app/models/User';

export const dynamic = 'force-dynamic';

export async function GET(request, context) {
    try {
        await dbConnect();
        const { id } = await context.params;

        const msgs = await Message.find({ conversation_id: id }).sort({ createdAt: 1 }).lean();
        
        // Populate sender info manually since sender_id could be string (email or id)
        const populatedMsgs = await Promise.all(msgs.map(async (m) => {
            // Because previous SQL Joined m.sender_id = u.id we check by _id or email
            const u = await User.findOne({ $or: [{ _id: m.sender_id }, { email: m.sender_id }] }).lean();
            return {
                id: m._id,
                sender_id: m.sender_id,
                content: m.content,
                created_at: m.createdAt,
                sender_name: u ? u.name : null,
                sender_role: u ? u.role : null
            };
        }));

        const conv = await Conversation.findById(id).lean();
        let formattedConv = null;

        if (conv) {
            const u1 = await User.findOne({ email: conv.participant_one }).lean() || await User.findById(conv.participant_one).lean();
            const u2 = await User.findOne({ email: conv.participant_two }).lean() || await User.findById(conv.participant_two).lean();
            
            formattedConv = {
                id: conv._id,
                participant_one: conv.participant_one,
                participant_two: conv.participant_two,
                updated_at: conv.updatedAt,
                created_at: conv.createdAt,
                p1_name: u1?.name,
                p1_role: u1?.role,
                p1_phone: u1?.phone,
                p1_specialization: u1?.specialization,
                p2_name: u2?.name,
                p2_role: u2?.role,
                p2_phone: u2?.phone,
                p2_specialization: u2?.specialization
            };
        }

        return NextResponse.json({
            success: true,
            messages: populatedMsgs,
            conversation: formattedConv
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to fetch messages' },
            { status: 500 }
        );
    }
}

export async function POST(request, context) {
    try {
        await dbConnect();
        const { id } = await context.params;
        const { sender_id, content } = await request.json();

        if (!sender_id || !content) {
            return NextResponse.json(
                { success: false, message: 'sender_id and content are required' },
                { status: 400 }
            );
        }

        const msg = await Message.create({
            conversation_id: id,
            sender_id,
            content
        });

        await Conversation.findByIdAndUpdate(id, { updatedAt: new Date() });

        return NextResponse.json({
            success: true,
            message: {
                id: msg._id,
                sender_id: msg.sender_id,
                content: msg.content,
                created_at: msg.createdAt
            }
        }, { status: 201 });
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json(
            { success: false, message: 'Failed to send message' },
            { status: 500 }
        );
    }
}
