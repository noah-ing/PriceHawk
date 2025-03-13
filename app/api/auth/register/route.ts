import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/utils/auth-utils';
import { z } from 'zod';
import crypto from 'crypto';
import { emailService } from '@/lib/services/email-service';

/**
 * Generate a verification token
 */
function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}



// Define the registration schema using Zod
const registrationSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Validate the request body
    const result = registrationSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'Invalid registration data',
            details: result.error.format(),
          },
        },
        { status: 400 }
      );
    }
    
    const { name, email, password } = result.data;
    
    // Check if the user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: {
            message: 'User with this email already exists',
            code: 'USER_EXISTS',
          },
        },
        { status: 409 }
      );
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(password);
    
    // Generate a verification token
    const token = generateVerificationToken();
    const expires = new Date();
    expires.setHours(expires.getHours() + 24); // Token expires in 24 hours
    
    // Create the user with verification token
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: null, // Not verified yet
        resetToken: token, // Using resetToken for verification
        resetTokenExpires: expires,
      },
    });
    
    // Send verification email
    try {
      await emailService.sendVerificationEmail(email, token);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue with registration even if email fails
    }
    
    // Return success response (excluding the password)
    return NextResponse.json(
      {
        success: true,
        data: {
          id: user.id,
          name: user.name,
          email: user.email,
          verificationSent: true,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error during registration:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          message: 'An unexpected error occurred during registration',
          code: 'REGISTRATION_FAILED',
        },
      },
      { status: 500 }
    );
  }
}
