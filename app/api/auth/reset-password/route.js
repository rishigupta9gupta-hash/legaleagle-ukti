import { NextResponse } from 'next/server';
import dbConnect from '@/app/lib/dbConnect';
import User from '@/app/models/User';
import PasswordReset from '@/app/models/PasswordReset';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        await dbConnect();
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ success: false, message: 'Missing token or password' }, { status: 400 });
        }

        // Validate Token
        const resetRecord = await PasswordReset.findOne({
            token,
            expires: { $gt: new Date() }
        });

        if (!resetRecord) {
            return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
        }

        const email = resetRecord.email;

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update User
        await User.updateOne({ email }, { $set: { password: hashedPassword } });

        // Consume Token
        await PasswordReset.deleteOne({ token });

        return NextResponse.json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
