import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Certification from '@/app/models/Certification';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        await dbConnect();
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
        }

        const certs = await Certification.find({ user_email: email }).sort({ createdAt: -1 }).lean();

        const mappedCerts = certs.map(c => ({
            ...c,
            created_at: c.createdAt,
            id: c._id
        }));

        return NextResponse.json({ success: true, certifications: mappedCerts });
    } catch (error) {
        console.error('Error fetching certifications:', error);
        return NextResponse.json({ success: false, error: 'Failed to fetch certifications' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        await dbConnect();
        const { email, title, file_url, file_type } = await req.json();

        if (!email || !title || !file_url) {
            return NextResponse.json(
                { success: false, error: 'Email, title, and file_url are required' },
                { status: 400 }
            );
        }

        const cert = await Certification.create({
            user_email: email,
            title,
            file_url,
            file_type: file_type || 'image'
        });

        const certData = cert.toObject();
        certData.created_at = certData.createdAt;
        certData.id = certData._id;

        return NextResponse.json({
            success: true,
            certification: certData,
            message: 'Certification added successfully'
        }, { status: 201 });
    } catch (error) {
        console.error('Error adding certification:', error);
        return NextResponse.json({ success: false, error: 'Failed to add certification' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        await dbConnect();
        const { id, email } = await req.json();

        if (!id || !email) {
            return NextResponse.json(
                { success: false, error: 'Certification ID and email are required' },
                { status: 400 }
            );
        }

        const deleted = await Certification.findOneAndDelete({ _id: id, user_email: email });

        if (!deleted) {
            return NextResponse.json({ success: false, error: 'Certification not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Certification deleted' });
    } catch (error) {
        console.error('Error deleting certification:', error);
        return NextResponse.json({ success: false, error: 'Failed to delete certification' }, { status: 500 });
    }
}
