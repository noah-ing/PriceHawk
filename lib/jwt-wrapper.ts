/**
 * JWT Wrapper Module
 * 
 * This module provides direct pass-through to NextAuth's JWT functions.
 * We've simplified it to avoid conflicts with NextAuth's JWT implementation.
 */

import type { JWT, JWTEncodeParams, JWTDecodeParams } from 'next-auth/jwt';
import { encode as nextAuthEncode, decode as nextAuthDecode } from 'next-auth/jwt';

/**
 * Enhanced encode function with error handling
 */
export async function encode<T extends JWT = JWT>(params: JWTEncodeParams<T>): Promise<string> {
  try {
    // Safety check - if payload is null/undefined, use empty object
    if (!params.token) {
      console.error('[JWT] Received null/undefined token for encoding, using empty object');
      params.token = {} as T;
    }
    
    // Call NextAuth's encode function
    return nextAuthEncode(params);
  } catch (error) {
    console.error('[JWT] Error encoding token:', error);
    // Return a failsafe empty token
    const safeParams = {
      ...params,
      token: { exp: Math.floor(Date.now() / 1000) + 3600 } as T, // 1 hour expiry
      secret: params.secret || process.env.NEXTAUTH_SECRET || 'fallback-secret'
    };
    return nextAuthEncode(safeParams);
  }
}

/**
 * Enhanced decode function with error handling
 */
export async function decode<T extends JWT = JWT>(params: JWTDecodeParams): Promise<T | null> {
  try {
    // Safety check - if token is not provided, return null
    if (!params.token) {
      console.error('[JWT] Received null/undefined token for decoding');
      return null;
    }
    
    // Call NextAuth's decode function
    return nextAuthDecode(params);
  } catch (error) {
    console.error('[JWT] Error decoding token:', error);
    return null;
  }
}

/**
 * Simple session validation 
 */
export async function validateSession(token: JWT | null | undefined): Promise<boolean> {
  if (!token) return false;
  
  try {
    // Basic validation
    if (!token.sub) {
      console.warn(`Token missing 'sub' field`);
      return false;
    }
    
    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (token.exp && token.exp < now) {
      console.warn(`Token expired`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`Session validation error:`, error);
    return false;
  }
}
