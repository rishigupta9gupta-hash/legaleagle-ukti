import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return NextResponse.json({ success: false, message: 'Missing token or password' }, { status: 400 });
        }

        // Validate Token
        const resetRes = await query(
            'SELECT * FROM password_resets WHERE token = $1 AND expires > NOW()',
            [token]
        );

        if (resetRes.rows.length === 0) {
            return NextResponse.json({ success: false, message: 'Invalid or expired token' }, { status: 400 });
        }

        const email = resetRes.rows[0].email;

        // Hash Password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Update User
        await query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

        // Consume Token
        await query('DELETE FROM password_resets WHERE token = $1', [token]);

        return NextResponse.json({ success: true, message: 'Password reset successfully' });

    } catch (error) {
        console.error('Reset Password Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
