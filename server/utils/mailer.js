import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send an OTP email to the user
 * @param {string} to - Recipient email
 * @param {string} otp - The OTP code
 */
export const sendOtpEmail = async (to, otp) => {
  try {
    const mailOptions = {
      from: `"Road2Dev" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Your OTP for Road2Dev Registration',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0c0c0c; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #40c8e0; font-family: 'Syne', sans-serif; margin: 0;">Road2Dev</h2>
          </div>

          <div style="background: #141414; border-radius: 10px; padding: 24px;">
            <h3 style="color: #f0f0f0; margin: 0 0 12px;">Verify Your Email</h3>
            <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Thank you for signing up! Use the following OTP to verify your email address. This code will expire in <strong style="color: #f0f0f0;">10 minutes</strong>.
            </p>

            <div style="text-align: center; background: #1c1c1c; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #40c8e0; font-family: 'Courier New', monospace;">${otp}</span>
            </div>

            <p style="color: #666; font-size: 12px; line-height: 1.5; margin: 0;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>

          <p style="color: #444; font-size: 11px; text-align: center; margin-top: 16px;">
            &copy; 2025 Road2Dev. All rights reserved.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email send error:', error.message);
    return false;
  }
};

/**
 * Send a password reset email to the user
 * @param {string} to - Recipient email
 * @param {string} resetToken - The password reset token
 * @param {string} userName - User's name (optional)
 */
export const sendPasswordResetEmail = async (to, resetToken, userName) => {
  try {
    const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?token=${resetToken}`;

    const mailOptions = {
      from: `"Road2Dev" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Reset Your Road2Dev Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0c0c0c; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #40c8e0; font-family: 'Syne', sans-serif; margin: 0;">Road2Dev</h2>
          </div>

          <div style="background: #141414; border-radius: 10px; padding: 24px;">
            <h3 style="color: #f0f0f0; margin: 0 0 12px;">Password Reset Request</h3>
            <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
              Hello${userName ? ' ' + userName : ''},
            </p>
            <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              We received a request to reset your password. Click the button below to choose a new password. This link will expire in <strong style="color: #f0f0f0;">60 minutes</strong>.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${resetUrl}"
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #5b8dee, #9b6dff); color: #fff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; font-family: Arial, sans-serif;">
                Reset Password
              </a>
            </div>

            <p style="color: #666; font-size: 12px; line-height: 1.5; margin: 0 0 12px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #40c8e0; font-size: 11px; line-height: 1.5; word-break: break-all; margin: 0 0 16px;">
              ${resetUrl}
            </p>

            <p style="color: #666; font-size: 12px; line-height: 1.5; margin: 0;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>

          <p style="color: #444; font-size: 11px; text-align: center; margin-top: 16px;">
            &copy; 2025 Road2Dev. All rights reserved.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Password reset email send error:', error.message);
    return false;
  }
};

/**
 * Send an email verification link to the user
 * @param {string} to - Recipient email
 * @param {string} verificationToken - The email verification token
 * @param {string} userName - User's name (optional)
 */
export const sendVerificationEmail = async (to, verificationToken, userName) => {
  try {
    const verifyUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/auth?verify=${verificationToken}`;

    const mailOptions = {
      from: `"Road2Dev" <${process.env.EMAIL_USER}>`,
      to,
      subject: 'Verify Your Road2Dev Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0c0c0c; border-radius: 12px; border: 1px solid rgba(255,255,255,0.07);">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #40c8e0; font-family: 'Syne', sans-serif; margin: 0;">Road2Dev</h2>
          </div>

          <div style="background: #141414; border-radius: 10px; padding: 24px;">
            <h3 style="color: #f0f0f0; margin: 0 0 12px;">Verify Your Email Address</h3>
            <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 12px;">
              Hello${userName ? ' ' + userName : ''},
            </p>
            <p style="color: #888; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
              Thanks for signing up! Click the button below to verify your email address. This link will expire in <strong style="color: #f0f0f0;">24 hours</strong>.
            </p>

            <div style="text-align: center; margin-bottom: 24px;">
              <a href="${verifyUrl}"
                 style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #5b8dee, #9b6dff); color: #fff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; font-family: Arial, sans-serif;">
                Verify Email
              </a>
            </div>

            <p style="color: #666; font-size: 12px; line-height: 1.5; margin: 0 0 12px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <p style="color: #40c8e0; font-size: 11px; line-height: 1.5; word-break: break-all; margin: 0 0 16px;">
              ${verifyUrl}
            </p>

            <p style="color: #666; font-size: 12px; line-height: 1.5; margin: 0;">
              If you didn't create an account, you can safely ignore this email.
            </p>
          </div>

          <p style="color: #444; font-size: 11px; text-align: center; margin-top: 16px;">
            &copy; 2025 Road2Dev. All rights reserved.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Verification email send error:', error.message);
    return false;
  }
};