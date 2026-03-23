import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import Report from '@/app/models/Report';

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

        const reports = await Report.find({ user_id: userId }).sort({ createdAt: -1 }).lean();

        const mappedReports = reports.map(r => ({
            ...r,
            created_at: r.createdAt,
            file_name: r.fileName,
            file_type: r.fileType,
            file_url: r.fileUrl,
            id: r._id
        }));

        return NextResponse.json({
            success: true,
            data: mappedReports
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
        const { userId, fileName, fileType, fileUrl, analysis, summary } = body;

        if (!userId || !fileName) {
            return NextResponse.json(
                { success: false, message: 'User ID and File Name are required' },
                { status: 400 }
            );
        }

        const newReport = await Report.create({
            user_id: userId,
            fileName: fileName,
            fileType: fileType,
            fileUrl: fileUrl,
            analysis,
            summary
        });

        const reportData = newReport.toObject();
        reportData.created_at = reportData.createdAt;
        reportData.file_name = reportData.fileName;
        reportData.file_type = reportData.fileType;
        reportData.file_url = reportData.fileUrl;

        return NextResponse.json({
            success: true,
            data: reportData
        });
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
