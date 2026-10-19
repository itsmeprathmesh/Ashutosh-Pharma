"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Plus } from "lucide-react";
import { addEnquiryItem } from "@/components/EnquiryList";

export type CatalogProduct = { name: string; slug: string; imageUrl: string | null; packSize?: string | null; description?: string; category: { name: string; slug?: string } };
function safeImageSource(source: string | null) {
  if (!source) return null;
  if (/^\/products\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(source)) return source;
  try { const parsed = new URL(source); return parsed.protocol === "https:" && parsed.hostname.endsWith(".public.blob.vercel-storage.com") ? source : null; } catch { return null; }
}
export function AddProductButton({ product, heart = false }: { product: Pick<CatalogProduct, "name" | "slug">; heart?: boolean }) {
  return heart ? <button className="icon-button heart-button" aria-label={`Save ${product.name} to enquiry list`} onClick={() => addEnquiryItem({ product: product.name, quantity: "", slug: product.slug })}><Heart size={18}/></button> : <button className="button button-small" onClick={() => addEnquiryItem({ product: product.name, quantity: "", slug: product.slug })}><Plus size={15}/> Add to enquiry</button>;
}
export function ProductCard({ product }: { product: CatalogProduct }) {
  const image = safeImageSource(product.imageUrl);
  return <article className="product-card product-card-modern"><Link href={`/product/${product.slug}`} className="product-visual" aria-label={`View ${product.name}`}>
    {image ? <Image src={image} alt={product.name} fill sizes="(max-width: 680px) 90vw, (max-width: 1000px) 45vw, 25vw" unoptimized/> : <div className="product-placeholder" aria-hidden="true"><span>Rx</span><small>Trade catalogue</small></div>}
  </Link><div className="product-card-copy"><span className="product-category">{product.category.name}</span><Link href={`/product/${product.slug}`}><h3>{product.name}</h3></Link>{product.packSize && <p>{product.packSize}</p>}<div className="product-card-actions"><AddProductButton product={product}/><AddProductButton product={product} heart/></div></div>
  </article>;
}
