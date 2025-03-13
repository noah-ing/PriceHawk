import { DefaultSession } from "next-auth";
import { Product as PrismaProduct, PriceHistory } from "@prisma/client";

declare module "next-auth" {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      id: string;
      emailVerified?: Date | null;
      subscriptionTier?: string;
      subscriptionStatus?: string | null;
      subscriptionPeriodEnd?: Date | null;
    } & DefaultSession["user"];
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    id: string;
    emailVerified?: Date | null;
    subscriptionTier?: string;
    subscriptionStatus?: string | null;
    subscriptionPeriodEnd?: Date | null;
  }
}

/**
 * Extended Product type with price history
 */
export interface ProductWithPriceHistory extends PrismaProduct {
  priceHistory?: PriceHistory[];
}
