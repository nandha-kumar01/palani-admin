import nodemailer from 'nodemailer';

// Create email transporter
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

// Send OTP email
export async function sendOTPEmail(email: string, otp: string, type: 'reset' | 'resend' = 'reset') {
  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email service not configured');
    }

    const transporter = createTransporter();

    // Verify transporter configuration
    await transporter.verify();

    const subject = type === 'resend' 
      ? 'New Password Reset OTP - Palani App'
      : 'Password Reset OTP - Palani App';

    const mailOptions = {
      from: `"Palani Mobile App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); border-radius: 15px;">
          <div style="background: white; padding: 30px; border-radius: 10px; text-align: center;">
            <div style="margin-bottom: 20px;">
              <h1 style="color: #FF6B35; font-size: 28px; margin: 0;"> App</h1>
              <p style="color: #666; font-size: 14px; margin: 5px 0;">Your Digital Spiritual Companion</p>
            </div>
            <h2 style="color: #FF6B35; margin-bottom: 20px;">
              ${type === 'resend' ? ' New Password Reset OTP' : ' Password Reset Request'}
            </h2>
            <p style="font-size: 16px; color: #333; margin-bottom: 25px;">
              ${type === 'resend' 
                ? 'You have requested a new OTP. Use the following code to reset your password in your mobile app:' 
                : 'You have requested to reset your password. Enter the following OTP in your Palani mobile app:'
              }
            </p>
            <div style="background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); color: white; padding: 20px; border-radius: 10px; font-size: 36px; font-weight: bold; letter-spacing: 10px; margin: 25px 0;">
              ${otp}
            </div>
            <div style="background: #FFF8F0; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p style="font-size: 14px; color: #FF6B35; margin: 0; font-weight: bold;">
                 Valid for 10 minutes only
              </p>
            </div>
            <p style="font-size: 14px; color: #666; margin-top: 15px;">
               Open your Palani mobile app and enter this OTP to continue.
            </p>
            <p style="font-size: 14px; color: #666; margin-top: 10px;">
              If you didn't request this, please ignore this email and your account will remain secure.
            </p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="font-size: 12px; color: #999;">
                This is an automated message from Palani Mobile App. Please do not reply to this email.
              </p>
              <p style="font-size: 11px; color: #999; margin-top: 10px;">
                Om Muruga! 
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };

  } catch (error: any) {
    console.error('Email sending error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Send welcome email
export async function sendWelcomeEmail(email: string, name: string) {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Email service not configured');
    }

    const transporter = createTransporter();
    await transporter.verify();

    const mailOptions = {
      from: `"Palani Padayathirai Mobile App" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Palani Padayathirai App - Your Spiritual Journey Begins!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #FF6B35 0%, #F7931E 100%); border-radius: 15px;">
          <div style="background: white; padding: 30px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 25px;">
              <h1 style="color: #FF6B35; font-size: 32px; margin: 0;"> Palani Padayathirai App</h1>
              <p style="color: #666; font-size: 14px; margin: 5px 0;">Your Digital Spiritual Companion</p>
            </div>
            <h2 style="color: #FF6B35; margin-bottom: 20px;">Welcome, ${name}! </h2>
            <p style="font-size: 16px; color: #333; margin-bottom: 20px;">
              Your account has been successfully created. We're excited to have you join us on this spiritual journey!
            </p>
            <div style="background: #FFF8F0; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <h3 style="color: #FF6B35; margin-top: 0;"> What you can do with Palani App:</h3>
              <ul style="color: #666; line-height: 1.8; text-align: left;">
                <li>Track your Pathayathirai journey</li>
                <li> Discover temples and Madangals</li>
                <li>Join or create groups for pilgrimage</li>
                <li>Find Annadhanam centers nearby</li>
                <li>Listen to devotional songs</li>
                <li>Daily quotes and mantras</li>
                <li>Share your spiritual moments</li>
              </ul>
            </div>
            <div style="text-align: center; margin: 25px 0;">
              <p style="font-size: 14px; color: #666;">
                Download the app now and start your journey!
              </p>
              <div style="margin-top: 15px;">
                <a href="#" style="display: inline-block; margin: 5px; padding: 12px 25px; background: #FF6B35; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">📱 Download App</a>
              </div>
            </div>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
              <p style="font-size: 12px; color: #999;">
                Thank you for joining the Palani App community!
              </p>
              <p style="font-size: 14px; color: #FF6B35; margin-top: 10px; font-weight: bold;">
                Om Muruga!
              </p>
            </div>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };

  } catch (error: any) {
    console.error('Welcome email error:', error);
    throw new Error(`Failed to send welcome email: ${error.message}`);
  }
}
