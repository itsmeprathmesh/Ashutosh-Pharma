ALTER TABLE "Category"
  ADD COLUMN "imageUrl" TEXT;

ALTER TABLE "Product"
  ADD COLUMN "featuredRank" INTEGER,
  ADD COLUMN "showIndicativePrice" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "Offer" (
  "id" SERIAL NOT NULL,
  "title" TEXT NOT NULL,
  "shortText" TEXT NOT NULL,
  "buttonText" TEXT,
  "buttonUrl" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT false,
  "validUntil" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Review" (
  "id" SERIAL NOT NULL,
  "quote" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "company" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "reviewDate" TIMESTAMP(3) NOT NULL,
  "approved" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Offer_active_validUntil_createdAt_idx" ON "Offer"("active", "validUntil", "createdAt");
CREATE INDEX "Review_approved_reviewDate_idx" ON "Review"("approved", "reviewDate");
