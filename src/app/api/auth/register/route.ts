import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Group from '@/models/Group';
import { hashPassword, generateToken, generateRefreshToken } from '@/lib/auth';
import { withTimeout, handleApiError } from '@/lib/apiTimeout';
import nodemailer from 'nodemailer';
import crypto from 'crypto';


// Create transporter function
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
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
        { success: false, error: 'Email service not configured. Please contact administrator.' },
        { status: 500 }
      );
    }

    await dbConnect();
    
    const { name, email, phone, password, groupId } = await request.json();

    // Validate required fields
    if (!name || !email || !phone || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'All fields are required' 
      }, { status: 400 });
    }

    // Check if user already exists (active users only)
    const existingUser = await withTimeout(
      User.findOne({ 
        $or: [{ email }, { phone }],
        isActive: true
      }).maxTimeMS(10000), 
      15000, 
      'Database operation timeout'
    );
    
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        error: 'User with this email or phone already exists' 
      }, { status: 409 });
    }

    // Check for pending registration (inactive user with same email)
    const pendingUser = await withTimeout(
      User.findOne({ 
        email: email.toLowerCase(),
        isActive: false
      }).maxTimeMS(10000), 
      15000, 
      'Database operation timeout'
    );

    // Generate 6-digit OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Hash password
    const hashedPassword = await hashPassword(password);

    if (pendingUser) {
      // Update existing pending registration
      pendingUser.name = name;
      pendingUser.phone = phone;
      pendingUser.password = hashedPassword;
      pendingUser.groupId = groupId || null;
      pendingUser.resetPasswordOTP = otpCode;
      pendingUser.resetPasswordExpiry = otpExpiry;
      
      await withTimeout(pendingUser.save(), 15000, 'Database operation timeout');
    } else {
      // Create new temporary user (inactive until OTP verification)
      const newUser = new User({
        name,
        email: email.toLowerCase(),
        phone,
        password: hashedPassword,
        groupId: groupId || null,
        joinedGroupAt: groupId ? new Date() : null,
        resetPasswordOTP: otpCode,
        resetPasswordExpiry: otpExpiry,
        isActive: false, // Keep inactive until OTP verification
        status: 'inactive'
      });

      await withTimeout(newUser.save(), 15000, 'Database operation timeout');
    }

    // Send OTP email
    const transporter = createTransporter();
    
    // Verify transporter configuration
    try {
      await transporter.verify();
    } catch (verifyError) {
      return NextResponse.json(
        { success: false, error: 'Email service configuration error. Please contact administrator.' },
        { status: 500 }
      );
    }

    const mailOptions = {
      from: `"Palani Pathayathirai" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Palani Pathayathirai- Email Verification',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration Verification</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
          
          <!-- Email Container -->
          <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px 10px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="color: white; font-size: 28px; font-weight: bold; margin: 0;">
                Palani Padayathirai
              </h1>
              <p style="color: rgba(255,255,255,0.9); font-size: 16px; margin: 8px 0 0 0;">
                Sacred Pilgrimage App
              </p>
            </div>

            <!-- Main Content -->
            <div style="padding: 20px 10px;">
              
              <!-- Welcome -->
              <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #333; font-size: 22px; margin-bottom: 10px;">
                  Welcome, ${name}!
                </h2>
                <p style="color: #666; font-size: 16px; margin: 0;">
                  Please verify your email to complete registration
                </p>
              </div>

              <!-- OTP Section -->
              <div style="text-align: center; margin: 30px 0;">
                <p style="color: #333; font-size: 16px; margin-bottom: 20px; font-weight: 500;">
                  Your Verification Code
                </p>
                
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; display: inline-block; margin: 10px 0; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                  <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">
                    ${otpCode}
                  </div>
                </div>
              </div>

              <!-- Instructions -->
              <div style="background-color: #e9eef6; padding: 20px; border-radius: 6px; border-left: 4px solid #667eea; margin: 25px 0;">
                <p style="color: #333; font-size: 14px; font-weight: 500; margin: 0 0 10px 0;">
                  Important Instructions:
                </p>
                <ul style="color: #666; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.5;">
                  <li>This code expires in <strong>10 minutes</strong></li>
                  <li>Enter this code in the app to complete registration</li>
                  <li>Keep this code secure and confidential</li>
                  <li>If you didn't request this, please ignore this email</li>
                </ul>
              </div>

              <!-- App Info -->
              <div style="text-align: center; margin-top: 25px; padding: 15px; background: #e9eef6; border-radius: 6px;">
                <p style="color: #666; font-size: 14px; margin: 0; font-style: italic;">
                  "Step into Devotion, Walk towards Lord Murugan’s Grace" 
                </p>
              </div>

            </div>

            <!-- Footer -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; border-top: 1px solid #eee;">
              <p style="font-size: 12px; margin: 0;">
                © 2025 Palani Pathayathirai. All rights reserved.
              </p>
            </div>

          </div>
        </body>
        </html>
      `,
    };
              // <img src="https://res.cloudinary.com/dy5vca5ux/image/upload/v1761306227/logonobg_xawm99.png" alt="Palani Padayathirai Logo" style="height: 60px; width: auto; max-width: 200px; margin-bottom: 20px; background: white; padding: 15px; border-radius: 12px; box-shadow: 0 4px 15px rgba(255,255,255,0.2);" />

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: 'Registration initiated. Please check your email for OTP verification.',
      requiresOTP: true,
      email: email.toLowerCase() // Return email for frontend to use in next step
    }, { status: 200 });

  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle specific email errors
    if (error instanceof Error && error.message.includes('Missing credentials')) {
      return NextResponse.json(
        { success: false, error: 'Email service not properly configured. Please check environment variables.' },
        { status: 500 }
      );
    }
    
    if (error instanceof Error && error.message.includes('Invalid login')) {
      return NextResponse.json(
        { success: false, error: 'Email authentication failed. Please check email credentials.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to process registration. Please try again later.' 
    }, { status: 500 });
  }
}
