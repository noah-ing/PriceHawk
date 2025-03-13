-- CreateTable
CREATE TABLE "UserProductSettings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "markupPercentage" DOUBLE PRECISION NOT NULL DEFAULT 30.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserProductSettings_pkey" PRIMARY KEY ("id")
);

-- Create unique index for one setting per user-product pair
CREATE UNIQUE INDEX "UserProductSettings_userId_productId_key" ON "UserProductSettings"("userId", "productId");

-- Create indexes for faster lookups
CREATE INDEX "UserProductSettings_userId_idx" ON "UserProductSettings"("userId");
CREATE INDEX "UserProductSettings_productId_idx" ON "UserProductSettings"("productId");

-- Add foreign key constraints
ALTER TABLE "UserProductSettings" ADD CONSTRAINT "UserProductSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserProductSettings" ADD CONSTRAINT "UserProductSettings_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
