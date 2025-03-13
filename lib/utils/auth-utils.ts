import crypto from 'crypto';
import { promisify } from 'util';

// Promisify crypto functions
const randomBytes = promisify(crypto.randomBytes);
const pbkdf2 = promisify(crypto.pbkdf2);

// Constants for password hashing
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
const ITERATIONS = 10000;
const DIGEST = 'sha512';

/**
 * Hash a password using PBKDF2
 * @param password The plain text password to hash
 * @returns The hashed password with salt in format: salt:hash
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = await randomBytes(SALT_LENGTH);
  
  // Hash the password with the salt
  const hash = await pbkdf2(
    password, 
    salt, 
    ITERATIONS, 
    KEY_LENGTH, 
    DIGEST
  );
  
  // Return the salt and hash as a string
  return `${salt.toString('hex')}:${hash.toString('hex')}`;
}

/**
 * Compare a plain text password with a hash
 * @param password The plain text password
 * @param storedHash The hashed password with salt
 * @returns True if the password matches the hash, false otherwise
 */
export async function comparePassword(password: string, storedHash: string | null | undefined): Promise<boolean> {
  try {
    // Check if storedHash is valid
    if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
      console.error('Invalid stored hash format');
      return false;
    }
    
    // Split the stored hash into salt and hash
    const [salt, hash] = storedHash.split(':');
    
    if (!salt || !hash) {
      console.error('Invalid stored hash format: missing salt or hash');
      return false;
    }
    
    // Hash the provided password with the stored salt
    const hashBuffer = await pbkdf2(
      password, 
      Buffer.from(salt, 'hex'), 
      ITERATIONS, 
      KEY_LENGTH, 
      DIGEST
    );
    
    // Compare the hashes
    return crypto.timingSafeEqual(
      hashBuffer,
      Buffer.from(hash, 'hex')
    );
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}
