CREATE INDEX CONCURRENTLY "Product_published_status_name_idx" ON "Product"("published", "status", "name");
CREATE INDEX CONCURRENTLY "Product_published_status_createdAt_idx" ON "Product"("published", "status", "createdAt");
CREATE INDEX CONCURRENTLY "Product_categoryId_published_status_name_idx" ON "Product"("categoryId", "published", "status", "name");
CREATE INDEX CONCURRENTLY "Product_categoryId_published_status_createdAt_idx" ON "Product"("categoryId", "published", "status", "createdAt");
CREATE INDEX CONCURRENTLY "Enquiry_createdAt_idx" ON "Enquiry"("createdAt");
CREATE INDEX CONCURRENTLY "Enquiry_status_createdAt_idx" ON "Enquiry"("status", "createdAt");
CREATE INDEX CONCURRENTLY "BlogPost_published_createdAt_idx" ON "BlogPost"("published", "createdAt");
