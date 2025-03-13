/**
 * Simplified auth.ts file for PriceHawk
 * 
 * This file configures NextAuth.js with email/password authentication.
 * It includes TypeScript ignore comments to bypass errors with the beta version of NextAuth.js.
 */

// @ts-nocheck - Disable TypeScript checking for this file
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
// Google OAuth provider removed for current deployment
import CredentialsProvider from "next-auth/providers/credentials";
import crypto from 'crypto';
import { promisify } from 'util';
import { comparePassword } from "@/lib/utils/auth-utils";
import { encode, decode } from "@/lib/jwt-wrapper"; // Using our safer JWT wrapper

import { createEnhancedPrismaAdapter } from '@/lib/db/prisma-adapter-wrapper';

// Verify database connection before adapter creation
async function verifyDatabaseConnection() {
  console.log('[Auth] Verifying database connection...');
  try {
    await prisma.$connect();
    await prisma.user.count();
    console.log('[Auth] Database connection successful');
    return true;
  } catch (error) {
    console.error('[Auth] Database connection failed:', error);
    return false;
  }
}

// Initialize database connection verification and ensure it completes
// This is important to prevent race conditions during NextAuth initialization
let dbConnectionVerified = false;
(async () => {
  try {
    dbConnectionVerified = await verifyDatabaseConnection();
    console.log(`[Auth] Database connection verified: ${dbConnectionVerified}`);
  } catch (error) {
    console.error('[Auth] Database verification failed:', error);
    dbConnectionVerified = false;
  }
})();

// Configure NextAuth.js
export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use our enhanced adapter with retry logic and better error handling
  adapter: createEnhancedPrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET,
  jwt: {
    encode, // Using our safe wrapper functions imported from lib/jwt-wrapper
    decode,
    // Increased security and shorter lifetime for JWT tokens
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  providers: [
    // Google OAuth provider removed for simplified deployment
    CredentialsProvider({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Find the user by email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          });

          // If user doesn't exist or doesn't have a password (OAuth user)
          if (!user || !user.password) {
            return null;
          }

          // Verify the password
          const isPasswordValid = await comparePassword(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Return the user without the password
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            emailVerified: user.emailVerified,
            subscriptionTier: user.subscriptionTier,
            subscriptionStatus: user.subscriptionStatus,
            subscriptionPeriodEnd: user.subscriptionPeriodEnd
          };
        } catch (error) {
          console.error("Error in authorize callback:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async session({ session, token }) {
      try {
        // Add the user ID and subscription info from the token to the session
        if (session?.user && token?.sub) {
          session.user.id = token.sub;
          
          // Safely add subscription info to the session with defaults
          session.user.subscriptionTier = token.subscriptionTier || 'FREE';
          session.user.subscriptionStatus = token.subscriptionStatus || 'inactive';
          session.user.subscriptionPeriodEnd = token.subscriptionPeriodEnd || null;
          
          // Safely add email verification status
          session.user.emailVerified = token.emailVerified || null;
        }
        return session;
      } catch (error) {
        console.error("[Auth] Session callback error:", error);
        // Return a basic session to prevent complete auth failure
        return session;
      }
    },
    async jwt({ token, user, trigger, session }) {
      try {
        // Add the user ID to the JWT token when first created
        if (user && user.id) {
          token.sub = user.id;
          
          // Add subscription info if available from the user object
          if (user.subscriptionTier) {
            token.subscriptionTier = user.subscriptionTier;
            token.subscriptionStatus = user.subscriptionStatus;
            token.subscriptionPeriodEnd = user.subscriptionPeriodEnd;
            token.emailVerified = user.emailVerified;
          } else {
            // Otherwise, fetch it from the database
            try {
              const dbUser = await prisma.user.findUnique({
                where: { id: user.id },
                select: {
                  subscriptionTier: true,
                  subscriptionStatus: true,
                  subscriptionPeriodEnd: true,
                  emailVerified: true
                }
              });
              
              if (dbUser) {
                token.subscriptionTier = dbUser.subscriptionTier;
                token.subscriptionStatus = dbUser.subscriptionStatus;
                token.subscriptionPeriodEnd = dbUser.subscriptionPeriodEnd;
                token.emailVerified = dbUser.emailVerified;
              } else {
                // Set defaults if user not found
                token.subscriptionTier = 'FREE';
                token.subscriptionStatus = 'inactive';
              }
            } catch (error) {
              console.error("[Auth] Error fetching user data for JWT:", error);
              // Set default values if we can't fetch from the database
              token.subscriptionTier = 'FREE';
              token.subscriptionStatus = 'inactive';
            }
          }
        }
        
        // Handle session updates
        if (trigger === "update" && session) {
          // Update the token with the new session data
          if (session.user?.subscriptionTier) {
            token.subscriptionTier = session.user.subscriptionTier;
          }
          if (session.user?.subscriptionStatus) {
            token.subscriptionStatus = session.user.subscriptionStatus;
          }
          if (session.user?.subscriptionPeriodEnd) {
            token.subscriptionPeriodEnd = session.user.subscriptionPeriodEnd;
          }
          if (session.user?.emailVerified !== undefined) {
            token.emailVerified = session.user.emailVerified;
          }
        }
        
        return token;
      } catch (error) {
        console.error("[Auth] JWT callback error:", error);
        // Return a basic token to prevent complete auth failure
        return { ...token };
      }
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  logger: {
    error(code, ...message) {
      console.error(`[Auth] Error: ${code}`, ...message);
    },
    warn(code, ...message) {
      console.warn(`[Auth] Warning: ${code}`, ...message);
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === "development") {
        console.log(`[Auth] Debug: ${code}`, ...message);
      }
    },
  },
});
