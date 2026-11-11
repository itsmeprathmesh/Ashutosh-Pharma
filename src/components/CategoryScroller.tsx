"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, HeartPulse, Microscope, Pill, Stethoscope } from "lucide-react";
import type { HeaderCategory } from "@/components/PublicHeader";

const marks = [Pill, HeartPulse, Microscope, Stethoscope];

function approvedImage(source: string | null) {
  if (!source) return false;
  try {
    const url = new URL(source);
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch { return false; }
}

export function CategoryScroller({ categories }: { categories: HeaderCategory[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState<string[]>([]);
  if (!categories.length) return null;
  const move = (direction: -1 | 1) => scroller.current?.scrollBy({ left: direction * 390, behavior: "smooth" });

  return <section className="home-section category-section" aria-labelledby="category-section-title">
    <div className="container">
      <div className="section-heading-row">
        <div><span className="eyebrow">Browse by category</span><h2 id="category-section-title">A catalogue organised for trade</h2></div>
        <div className="section-heading-actions"><Link className="text-link" href="/shop">View all categories <ArrowRight size={15}/></Link><button className="scroll-arrow" aria-label="Scroll categories left" onClick={() => move(-1)}><ArrowLeft size={17}/></button><button className="scroll-arrow" aria-label="Scroll categories right" onClick={() => move(1)}><ArrowRight size={17}/></button></div>
      </div>
      <div className="category-scroller" ref={scroller} tabIndex={0} aria-label="Product categories">
        {categories.map((category, index) => {
          const Mark = marks[index % marks.length];
          const showImage = approvedImage(category.imageUrl) && !failed.includes(category.slug);
          return <Link className={`category-tile ${showImage ? "has-image" : "type-tile"}`} href={`/shop?cat=${category.slug}`} key={category.id}>
            {showImage ? <img src={category.imageUrl!} alt="" loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed((items) => [...items, category.slug])}/> : <div className="category-type-visual"><Mark size={34} strokeWidth={1.15}/><span>{category.name}</span></div>}
            <span className="category-label-band"><strong>{category.name}</strong><small>{category._count.products.toLocaleString("en-IN")} products</small></span>
          </Link>;
        })}
      </div>
    </div>
  </section>;
}
