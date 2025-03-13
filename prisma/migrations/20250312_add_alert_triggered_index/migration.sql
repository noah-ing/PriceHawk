-- Add missing index on Alert.triggered field identified by verify-indexes.js
CREATE INDEX IF NOT EXISTS "Alert_triggered_idx" ON "Alert"("triggered");
