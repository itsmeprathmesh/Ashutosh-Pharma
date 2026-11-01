CREATE TABLE "AdminLoginLockout" (
  "key" TEXT NOT NULL,
  "lockedUntil" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminLoginLockout_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "AdminLoginLockout_lockedUntil_idx" ON "AdminLoginLockout"("lockedUntil");
