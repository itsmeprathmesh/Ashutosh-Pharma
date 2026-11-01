ALTER TABLE "Product"
  ADD COLUMN "form" TEXT,
  ALTER COLUMN "status" SET DEFAULT 'review';

ALTER TABLE "Product"
  ADD COLUMN "images_migration" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

UPDATE "Product" AS product
SET "images_migration" = ARRAY(
  SELECT image.value
  FROM jsonb_array_elements_text(product."images") WITH ORDINALITY AS image(value, ordinal)
  ORDER BY image.ordinal
);

UPDATE "Product"
SET "imageUrl" = "images_migration"[1]
WHERE cardinality("images_migration") > 0;

ALTER TABLE "Product" DROP COLUMN "images";
ALTER TABLE "Product" RENAME COLUMN "images_migration" TO "images";
