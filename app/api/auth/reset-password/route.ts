/**
 * Password Reset API Route
 * 
 * This API route handles password reset requests.
 * It provides endpoints for initiating a password reset and resetting a password with a token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/utils/auth-utils';
import crypto from 'crypto';
import { z } from 'zod';
import { emailService } from '@/lib/services';

// Define the request schema for initiating a password reset
const requestResetSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// Define the request schema for resetting a password
const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

/**
 * POST handler for password reset requests
 * @param request The incoming request
 * @returns The API response
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Check if this is a reset request or a token verification
    if (body.email) {
      // This is a request to initiate a password reset
      const result = requestResetSchema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Invalid request data',
              details: result.error.format(),
            },
          },
          { status: 400 }
        );
      }
      
      const { email } = result.data;
      
      // Find the user by email
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      // If the user doesn't exist, still return success to prevent email enumeration
      if (!user) {
        return NextResponse.json(
          {
            success: true,
            message: 'If an account with that email exists, a password reset link has been sent.',
          },
          { status: 200 }
        );
      }
      
      // Generate a reset token
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date();
      expires.setHours(expires.getHours() + 1); // Token expires in 1 hour
      
      // Store the reset token in the database
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: token,
          resetTokenExpires: expires,
        },
      });
      
      // Send the reset email
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;
      
      await emailService.sendEmail({
        to: email,
        subject: 'PriceHawk Password Reset',
        text: `You requested a password reset. Please use the following link to reset your password: ${resetUrl}`,
        html: `
          <div>
            <h1>PriceHawk Password Reset</h1>
            <p>You requested a password reset. Please use the following link to reset your password:</p>
            <a href="${resetUrl}" style="display: inline-block; background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request a password reset, please ignore this email.</p>
          </div>
        `,
      });
      
      return NextResponse.json(
        {
          success: true,
          message: 'If an account with that email exists, a password reset link has been sent.',
        },
        { status: 200 }
      );
    } else if (body.token) {
      // This is a request to reset a password with a token
      const result = resetPasswordSchema.safeParse(body);
      
      if (!result.success) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Invalid request data',
              details: result.error.format(),
            },
          },
          { status: 400 }
        );
      }
      
      const { token, password } = result.data;
      
      // Find the user by reset token
      const user = await prisma.user.findFirst({
        where: {
          resetToken: token,
          resetTokenExpires: {
            gt: new Date(), // Token must not be expired
          },
        },
      });
      
      // If the user doesn't exist or the token is invalid, return an error
      if (!user) {
        return NextResponse.json(
          {
            success: false,
            error: {
              message: 'Invalid or expired reset token',
              code: 'INVALID_TOKEN',
            },
          },
          { status: 400 }
        );
      }
      
      // Hash the new password
      const hashedPassword = await hashPassword(password);
      
      // Update the user's password and clear the reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpires: null,
        },
      });
      
      return NextResponse.json(
        {
          success: true,
          message: 'Password has been reset successfully',
        },
        { status: 200 }
      );
    } else {
      // Invalid request
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid request',
            code: 'INVALID_REQUEST',
          },
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in password reset API route:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred',
          code: 'UNEXPECTED_ERROR',
        },
      },
      { status: 500 }
    );
  }
}
