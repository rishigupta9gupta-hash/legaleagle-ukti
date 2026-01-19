import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
        }

        // Check user
        const userRes = await query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            // Security: Don't reveal valid emails
            return NextResponse.json({ success: true, message: 'If this email is registered, you will receive a reset link.' });
        }

        // Generate Token
        const token = randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 hour

        // Save Token
        await query(
            'INSERT INTO password_resets (email, token, expires) VALUES ($1, $2, $3)',
            [email, token, expires]
        );

        // Send Email
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const resetUrl = `${new URL(request.url).origin}/reset-password?token=${token}`;

        await transporter.sendMail({
            from: `"VIRA Support" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset your VIRA password',
            html: `
                <h1>Reset Password</h1>
                <p>Click the link below to reset your password. Valid for 1 hour.</p>
                <a href="${resetUrl}">${resetUrl}</a>
                <p>If you did not request this, please ignore this email.</p>
            `
        });

        return NextResponse.json({ success: true, message: 'Reset link sent.' });

    } catch (error) {
        console.error('Forgot Password Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
