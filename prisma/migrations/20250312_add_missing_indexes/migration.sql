-- Add missing indexes identified in pre-deployment checks
CREATE INDEX IF NOT EXISTS "Product_url_idx" ON "Product"("url");
CREATE INDEX IF NOT EXISTS "Alert_isTriggered_idx" ON "Alert"("isTriggered");

-- Add comment to explain purpose of migration
COMMENT ON INDEX "Product_url_idx" IS 'Index for faster lookups by URL';
COMMENT ON INDEX "Alert_isTriggered_idx" IS 'Index for faster filtering of triggered alerts';
