import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Create transporter function
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export async function POST(request: NextRequest) {
  try {
    // Check if email credentials are available
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      return NextResponse.json(
        { error: 'Email service not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found with this email' },
        { status: 404 }
      );
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Set OTP expiry (10 minutes from now)
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Save OTP to user document
    user.resetPasswordOTP = otp;
    user.resetPasswordExpiry = otpExpiry;
    await user.save();

    // Send OTP email
    const transporter = createTransporter();
    
    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      return NextResponse.json(
        { error: 'Email service configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    const mailOptions = {
      from: `"Admin Panel" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Password Reset OTP - Admin Panel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px;">
          <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
            <h2 style="color: #667eea; margin-bottom: 20px;">Password Reset Request</h2>
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
              You have requested to reset your password. Use the following OTP to proceed:
            </p>
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; font-size: 24px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 20px;">
              This OTP will expire in 10 minutes. If you didn't request this reset, please ignore this email.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999;">
                This is an automated message. Please do not reply to this email.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { message: 'OTP sent successfully to your email' },
      { status: 200 }
    );

  } catch (error) {
    
    // Handle specific email errors
    if (error instanceof Error && error.message.includes('Missing credentials')) {
      return NextResponse.json(
        { error: 'Email service not properly configured. Please check environment variables.' },
        { status: 500 }
      );
    }
    
    if (error instanceof Error && error.message.includes('Invalid login')) {
      return NextResponse.json(
        { error: 'Email authentication failed. Please check email credentials.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again later.' },
      { status: 500 }
    );
  }
}