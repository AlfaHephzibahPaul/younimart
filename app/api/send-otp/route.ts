import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with your API key from your environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
    try {
        const { email, fullName } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email address is required' }, { status: 400 });
        }

        // 1. Generate a secure 6-digit verification code string
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // 2. Send the transactional email using Resend
        const { data, error } = await resend.emails.send({
            from: 'YOUnimart Verification <onboarding@resend.dev>',
            to: email,
            subject: `${otpCode} is your YOUnimart verification code`,
            html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #ea580c; text-align: center;">YOUnimart</h2>
          <p>Hello ${fullName || 'Student'},</p>
          <p>Thank you for registering with YOUnimart. Use the 6-digit verification code below to complete your campus status validation:</p>
          <div style="background-color: #f9fafb; border: 1px dashed #cbd5e1; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 4px; color: #111827; margin: 20px 0; border-radius: 12px;">
            ${otpCode}
          </div>
          <p style="font-size: 12px; color: #6b7280; text-align: center;">This code will expire shortly. If you did not request this, please ignore this email.</p>
        </div>
      `,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Send the generated code back to the client application safely
        return NextResponse.json({ success: true, code: otpCode });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}