CREATE INDEX "Product_published_status_name_idx" ON "Product"("published", "status", "name");
CREATE INDEX "Product_published_status_createdAt_idx" ON "Product"("published", "status", "createdAt");
CREATE INDEX "Product_categoryId_published_status_name_idx" ON "Product"("categoryId", "published", "status", "name");
CREATE INDEX "Product_categoryId_published_status_createdAt_idx" ON "Product"("categoryId", "published", "status", "createdAt");
CREATE INDEX "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");
CREATE INDEX "Enquiry_status_createdAt_idx" ON "Enquiry"("status", "createdAt");
CREATE INDEX "BlogPost_published_createdAt_idx" ON "BlogPost"("published", "createdAt");
