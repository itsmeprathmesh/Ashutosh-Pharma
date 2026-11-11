"use client";

import Image from "next/image";
import { useState } from "react";

function safeImage(source: string | null | undefined) {
  if (!source) return null;
  if (/^\/products\/[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(source)) return source;
  try {
    const url = new URL(source);
    return url.protocol === "https:" && (url.hostname.endsWith(".public.blob.vercel-storage.com") || url.hostname === "5.imimg.com") ? source : null;
  } catch { return null; }
}

export function ProductGallery({ name, images }: { name: string; images: string[] }) {
  const validImages = [...new Set(images.map(safeImage).filter((image): image is string => Boolean(image)))];
  const [selected, setSelected] = useState(validImages[0] ?? null);
  const [failed, setFailed] = useState<string[]>([]);
  const workingImages = validImages.filter((image) => !failed.includes(image));
  const currentImage = selected && workingImages.includes(selected) ? selected : workingImages[0];
  return <div className="product-gallery">
    <div className="product-gallery-main">{currentImage ? <Image key={currentImage} src={currentImage} alt={name} width={720} height={720} sizes="(max-width: 760px) 100vw, 45vw" priority referrerPolicy="no-referrer" onError={() => setFailed((items) => [...items, currentImage])}/> : <div className="product-placeholder" role="img" aria-label="No image available"><span>No image</span></div>}</div>
    {workingImages.length > 1 && <div className="product-gallery-thumbnails" aria-label="Product images">{workingImages.map((image, index) => <button type="button" key={image} aria-label={`Show product image ${index + 1}`} aria-pressed={currentImage === image} onClick={() => setSelected(image)}><Image src={image} alt="" width={72} height={72} sizes="72px" referrerPolicy="no-referrer" onError={() => setFailed((items) => [...items, image])}/></button>)}</div>}
  </div>;
}
