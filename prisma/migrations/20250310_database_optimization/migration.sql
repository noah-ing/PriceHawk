-- PriceHawk Database Optimization Migration
-- This migration adds strategic indexes to improve query performance for the PostgreSQL database

-- Price History Indexes
-- Optimizes time-series queries by productId and timestamp
CREATE INDEX IF NOT EXISTS "price_history_productId_timestamp_idx" ON "PriceHistory" ("productId", "timestamp");
-- Optimizes queries for price trends over time
CREATE INDEX IF NOT EXISTS "price_history_timestamp_idx" ON "PriceHistory" ("timestamp");

-- Alert Indexes
-- Optimizes alert filtering by userId and status
CREATE INDEX IF NOT EXISTS "alert_userId_status_idx" ON "Alert" ("userId", "status");
-- Optimizes alert filtering by triggeredAt date for notification processing
CREATE INDEX IF NOT EXISTS "alert_triggeredAt_idx" ON "Alert" ("triggeredAt");
-- Optimizes lookup of alerts by productId for price checking
CREATE INDEX IF NOT EXISTS "alert_productId_idx" ON "Alert" ("productId");

-- Product Indexes
-- Optimizes product search by userId
CREATE INDEX IF NOT EXISTS "product_userId_idx" ON "Product" ("userId");
-- Optimizes product filtering by retailer
CREATE INDEX IF NOT EXISTS "product_retailer_idx" ON "Product" ("retailer");
-- Optimizes product lookup for scheduled monitoring
CREATE INDEX IF NOT EXISTS "product_lastCheckedAt_idx" ON "Product" ("lastCheckedAt");

-- User Indexes
-- Optimizes user lookups by email
CREATE INDEX IF NOT EXISTS "user_email_idx" ON "User" ("email");
-- Optimizes subscription status queries
CREATE INDEX IF NOT EXISTS "user_subscriptionStatus_idx" ON "User" ("subscriptionStatus");

-- Combined indexes for common query patterns
-- Optimizes product listing with filtering
CREATE INDEX IF NOT EXISTS "product_userId_createdAt_idx" ON "Product" ("userId", "createdAt");
-- Optimizes alert listing with filtering
CREATE INDEX IF NOT EXISTS "alert_userId_createdAt_idx" ON "Alert" ("userId", "createdAt");

-- Partial indexes for frequently accessed subsets
-- Optimizes queries for active alerts only
CREATE INDEX IF NOT EXISTS "alert_active_idx" ON "Alert" ("userId") WHERE "status" = 'ACTIVE';
-- Optimizes queries for products checked more than 24 hours ago
CREATE INDEX IF NOT EXISTS "product_needs_check_idx" ON "Product" ("lastCheckedAt") 
WHERE "lastCheckedAt" < NOW() - INTERVAL '24 hours';
