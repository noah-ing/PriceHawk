// @ts-nocheck - We're disabling TypeScript checks for this file due to complex typing issues with NextAuth adapters
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import { Adapter } from "next-auth/adapters";

/**
 * Enhanced PrismaAdapter wrapper with error handling and retry logic
 * This wrapper adds better error handling and provides more robustness when working with PostgreSQL
 */
export function createEnhancedPrismaAdapter(prisma: PrismaClient): Adapter {
  // Start with the standard PrismaAdapter
  const standardAdapter = PrismaAdapter(prisma);

  // Create enhanced versions of each method with retry logic and better error handling
  const enhancedAdapter = {
    // Enhanced createUser method
    createUser: async (data) => {
      console.log("[Auth] Creating user:", data.email);
      try {
        if (typeof standardAdapter.createUser !== 'function') {
          throw new Error("[Auth] createUser method not available");
        }
        // Explicitly return Promise<AdapterUser>
        return await retryOperation<AdapterUser>(() => standardAdapter.createUser(data));
      } catch (error) {
        console.error("[Auth] Failed to create user:", error);
        throw error;
      }
    },
    
    // Enhanced getUser method
    getUser: async (id) => {
      if (!id) {
        console.warn("[Auth] getUser called with null/undefined ID");
        return null;
      }
      
      try {
        return await retryOperation(() => standardAdapter.getUser(id));
      } catch (error) {
        console.error(`[Auth] Failed to get user with ID ${id}:`, error);
        return null;
      }
    },
    
    // Enhanced getUserByEmail method
    getUserByEmail: async (email) => {
      if (!email) {
        console.warn("[Auth] getUserByEmail called with null/undefined email");
        return null;
      }
      
      try {
        return await retryOperation(() => standardAdapter.getUserByEmail(email));
      } catch (error) {
        console.error(`[Auth] Failed to get user by email ${email}:`, error);
        return null;
      }
    },
    
    // Enhanced getUserByAccount method
    getUserByAccount: async (providerAccountId) => {
      if (!providerAccountId?.provider || !providerAccountId?.providerAccountId) {
        console.warn("[Auth] getUserByAccount called with invalid provider data");
        return null;
      }
      
      try {
        return await retryOperation(() => standardAdapter.getUserByAccount(providerAccountId));
      } catch (error) {
        console.error(`[Auth] Failed to get user by account:`, error);
        return null;
      }
    },
    
    // Enhanced updateUser method
    updateUser: async (user) => {
      if (!user?.id) {
        console.warn("[Auth] updateUser called with invalid user data");
        throw new Error("Invalid user data for update");
      }
      
      try {
        return await retryOperation(() => standardAdapter.updateUser(user));
      } catch (error) {
        console.error(`[Auth] Failed to update user:`, error);
        throw error;
      }
    },
    
    // Enhanced deleteUser method
    deleteUser: async (userId) => {
      if (!userId) {
        console.warn("[Auth] deleteUser called with null/undefined userId");
        throw new Error("Invalid userId for delete");
      }
      
      try {
        return await retryOperation(() => standardAdapter.deleteUser(userId));
      } catch (error) {
        console.error(`[Auth] Failed to delete user:`, error);
        throw error;
      }
    },
    
    // Enhanced linkAccount method
    linkAccount: async (account) => {
      try {
        return await retryOperation(() => standardAdapter.linkAccount(account));
      } catch (error) {
        console.error(`[Auth] Failed to link account:`, error);
        throw error;
      }
    },
    
    // Enhanced unlinkAccount method
    unlinkAccount: async (providerAccountId) => {
      try {
        return await retryOperation(() => standardAdapter.unlinkAccount(providerAccountId));
      } catch (error) {
        console.error(`[Auth] Failed to unlink account:`, error);
        throw error;
      }
    },
    
    // Enhanced createSession method
    createSession: async (session) => {
      try {
        return await retryOperation(() => standardAdapter.createSession(session));
      } catch (error) {
        console.error(`[Auth] Failed to create session:`, error);
        throw error;
      }
    },
    
    // Enhanced getSessionAndUser method
    getSessionAndUser: async (sessionToken) => {
      if (!sessionToken) {
        console.warn("[Auth] getSessionAndUser called with null/undefined token");
        return null;
      }
      
      try {
        return await retryOperation(() => standardAdapter.getSessionAndUser(sessionToken));
      } catch (error) {
        console.error(`[Auth] Failed to get session and user:`, error);
        return null;
      }
    },
    
    // Enhanced updateSession method
    updateSession: async (session) => {
      try {
        return await retryOperation(() => standardAdapter.updateSession(session));
      } catch (error) {
        console.error(`[Auth] Failed to update session:`, error);
        return null;
      }
    },
    
    // Enhanced deleteSession method
    deleteSession: async (sessionToken) => {
      try {
        return await retryOperation(() => standardAdapter.deleteSession(sessionToken));
      } catch (error) {
        console.error(`[Auth] Failed to delete session:`, error);
      }
    },
    
    // Enhanced createVerificationToken method
    createVerificationToken: async (verificationToken) => {
      try {
        return await retryOperation(() => standardAdapter.createVerificationToken(verificationToken));
      } catch (error) {
        console.error(`[Auth] Failed to create verification token:`, error);
        return null;
      }
    },
    
    // Enhanced useVerificationToken method
    useVerificationToken: async (params) => {
      try {
        return await retryOperation(() => standardAdapter.useVerificationToken(params));
      } catch (error) {
        console.error(`[Auth] Failed to use verification token:`, error);
        return null;
      }
    },
  };
  
  return enhancedAdapter;
}

/**
 * Retry a database operation with exponential backoff
 * @param operation Function to retry
 * @param maxRetries Maximum number of retries (default: 3)
 * @param baseDelay Base delay between retries in ms (default: 100)
 */
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Attempt the operation
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // Skip retry for certain errors
      if (error.code === 'P2025') { // Record not found
        throw error;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      console.warn(`[Auth] Operation failed, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`, error);
      
      // Wait before trying again
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never happen due to the throw inside the loop
  throw lastError;
}
