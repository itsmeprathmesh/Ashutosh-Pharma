"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Heart, Plus } from "lucide-react";
import { addEnquiryItem } from "@/components/EnquiryList";

export type CatalogProduct = {
  name: string;
  slug: string;
  images?: string[];
  imageUrl: string | null;
  strength?: string | null;
  packSize?: string | null;
  form?: string | null;
  description?: string;
  rx?: boolean;
  category: { name: string; slug?: string };
  price?: { inr: string } | null;
};
function safeImageSource(source: string | null) {
  if (!source) return null;
  if (/^\/products\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(source)) return source;
  try {
    const parsed = new URL(source);
    return parsed.protocol === "https:" &&
      (parsed.hostname.endsWith(".public.blob.vercel-storage.com") ||
        parsed.hostname === "5.imimg.com")
      ? source
      : null;
  } catch {
    return null;
  }
}
export function AddProductButton({
  product,
  heart = false,
}: {
  product: Pick<CatalogProduct, "name" | "slug">;
  heart?: boolean;
}) {
  return heart ? (
    <button
      className="icon-button heart-button"
      aria-label={`Save ${product.name} to enquiry list`}
      onClick={() =>
        addEnquiryItem({
          product: product.name,
          quantity: "",
          slug: product.slug,
        })
      }
    >
      <Heart size={18} />
    </button>
  ) : (
    <button
      className="button button-small"
      onClick={() =>
        addEnquiryItem({
          product: product.name,
          quantity: "",
          slug: product.slug,
        })
      }
    >
      <Plus size={15} /> Add to enquiry
    </button>
  );
}
export function ProductCard({
  product,
  number,
}: {
  product: CatalogProduct;
  number?: number;
}) {
  const image = safeImageSource(product.images?.[0] ?? product.imageUrl);
  const [failedImage, setFailedImage] = useState<string | null>(null);
  const imageFailed = image !== null && failedImage === image;
  return (
    <article
      className={`product-card product-card-modern ${number ? "is-numbered" : ""}`}
    >
      <Link
        href={`/product/${product.slug}`}
        className="product-visual"
        aria-label={`View ${product.name}`}
      >
        {number !== undefined && (
          <span className="product-rank">
            {String(number).padStart(2, "0")}
          </span>
        )}
        {image && !imageFailed ? (
          <Image
            src={image}
            alt={product.name}
            fill
            sizes="(max-width: 680px) 90vw, (max-width: 1000px) 45vw, 25vw"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setFailedImage(image)}
          />
        ) : (
          <div
            className="product-placeholder"
            role="img"
            aria-label="No image available"
          >
            <span>No image</span>
            <small>Trade catalogue</small>
          </div>
        )}
      </Link>
      <div className="product-card-copy">
        <span className="product-category">{product.category.name}</span>
        {product.rx && (
          <small className="rx-label">Prescription · licensed buyers</small>
        )}
        <Link href={`/product/${product.slug}`}>
          <h3>{product.name}</h3>
        </Link>
        {(product.strength || product.packSize || product.form) && (
          <p className="product-specs">
            {[product.strength, product.packSize, product.form]
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {product.price && <p className="indicative-price">{product.price.inr}</p>}
        <div className="product-card-actions">
          <AddProductButton product={product} />
          <Link className="text-link" href={`/product/${product.slug}#quote`}>
            Product details
          </Link>
        </div>
      </div>
    </article>
  );
}
