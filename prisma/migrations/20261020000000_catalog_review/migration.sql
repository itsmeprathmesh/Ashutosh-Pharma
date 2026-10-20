CREATE TYPE "ProductStatus" AS ENUM ('active', 'review');
ALTER TABLE "Category" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Product"
  ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'active',
  ADD COLUMN "statusNote" TEXT,
  ADD COLUMN "priceInr" DECIMAL(12,2),
  ADD COLUMN "priceUnit" TEXT,
  ADD COLUMN "images" JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN "sourceRow" INTEGER;
ALTER TABLE "Product" ADD CONSTRAINT "Product_review_must_be_hidden" CHECK ("status" <> 'review' OR "published" = false);
ALTER TABLE "Enquiry" ADD COLUMN "productId" INTEGER;
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE "ProductAudit" (
  "id" SERIAL NOT NULL,
  "productId" INTEGER NOT NULL,
  "action" TEXT NOT NULL,
  "actor" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProductAudit_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductAudit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "ProductAudit_productId_createdAt_idx" ON "ProductAudit"("productId", "createdAt");
