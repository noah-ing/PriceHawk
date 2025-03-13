-- Adding missing columns to Alert table
ALTER TABLE "Alert" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "Alert" ADD COLUMN IF NOT EXISTS "triggeredAt" TIMESTAMP;

-- Adding missing columns to Product table
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "lastCheckedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for Alert table
CREATE INDEX IF NOT EXISTS "alert_userId_status_idx" ON "Alert" ("userId", "status");
CREATE INDEX IF NOT EXISTS "alert_triggeredAt_idx" ON "Alert" ("triggeredAt");
CREATE INDEX IF NOT EXISTS "alert_userId_createdAt_idx" ON "Alert" ("userId", "createdAt");

-- Create partial index for active alerts
CREATE INDEX IF NOT EXISTS "alert_active_idx" ON "Alert" ("userId") WHERE "status" = 'ACTIVE';

-- Create indexes for Product table 
CREATE INDEX IF NOT EXISTS "product_retailer_idx" ON "Product" ("retailer");
CREATE INDEX IF NOT EXISTS "product_lastCheckedAt_idx" ON "Product" ("lastCheckedAt");
CREATE INDEX IF NOT EXISTS "product_userId_createdAt_idx" ON "Product" ("userId", "createdAt");

-- Create composite index for PriceHistory
CREATE INDEX IF NOT EXISTS "price_history_productId_timestamp_idx" ON "PriceHistory" ("productId", "timestamp");

-- Create indexes for User model
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "User" ("email");
CREATE INDEX IF NOT EXISTS "user_subscriptionStatus_idx" ON "User" ("subscriptionStatus");
CREATE INDEX IF NOT EXISTS "user_subscriptionTier_idx" ON "User" ("subscriptionTier");
