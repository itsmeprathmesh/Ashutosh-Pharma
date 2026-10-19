"use client";

import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import { ProductCard, type CatalogProduct } from "@/components/ProductCard";
import { site } from "@/config/site";

export function HeroCarousel() {
  const [ref, api] = useEmblaCarousel({ loop: true }); const [selected, setSelected] = useState(0); const reduce = useReducedMotion();
  const onSelect = useCallback(() => { if (api) setSelected(api.selectedScrollSnap()); }, [api]);
  useEffect(() => { if (!api) return; api.on("select", onSelect); const timer = reduce ? undefined : window.setInterval(() => api.scrollNext(), 6500); return () => { api.off("select", onSelect); if (timer) clearInterval(timer); }; }, [api, onSelect, reduce]);
  return <section className="hero-carousel" aria-label="Featured information"><div className="embla-viewport" ref={ref}><div className="embla-container">{site.slides.map((slide, i) => <article className="hero-slide" key={slide.headline}><div className="container hero-slide-grid"><div><span className="eyebrow">Pharmaceutical exports · India</span>{i === 0 ? <motion.h1 initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}>{slide.headline}</motion.h1> : <h2>{slide.headline}</h2>}<p>{slide.text}</p><Link className="button" href="/contact">Request a quote <span aria-hidden="true">↗</span></Link></div><div className="hero-art"><Image src={slide.image} alt={slide.alt} width={480} height={360} priority={i === 0}/><span className="art-orbit" aria-hidden="true"/></div></div></article>)}</div></div><div className="hero-dots" aria-label="Choose slide">{site.slides.map((slide, i) => <button key={slide.headline} aria-label={`Show slide ${i + 1}`} aria-current={selected === i} onClick={() => api?.scrollTo(i)}/>)}</div></section>;
}

export function ProductRow({ title, label, products, href = "/shop" }: { title: string; label: string; products: CatalogProduct[]; href?: string }) {
  return <section className="section product-row"><div className="container"><div className="section-heading"><div><span className="eyebrow">{label}</span><h2>{title}</h2></div><Link className="text-link" href={href}>Explore catalogue ↗</Link></div>{products.length ? <div className="product-grid">{products.slice(0, 8).map((product) => <ProductCard key={product.slug} product={product}/>)}</div> : <div className="empty-state">The public product catalogue is being prepared. Contact our team to discuss a trade requirement.</div>}</div></section>;
}

export function MetricCounters() {
  const ref = useRef(null); const visible = useInView(ref, { once: true, amount: .35 }); const reduce = useReducedMotion();
  const data = [{ label: "Pharmaceutical products", value: site.metrics.products }, { label: "Satisfied clients", value: site.metrics.clients }, { label: "Years delivering", value: site.metrics.years }, { label: "Countries served", value: site.metrics.countries }];
  return <div className="metric-grid" ref={ref}>{data.map((metric) => <div className="metric" key={metric.label}>{metric.value === null ? <strong>TODO</strong> : <><strong><AnimatedMetric value={metric.value} visible={visible && !reduce}/></strong></>}<small>{metric.label}</small></div>)}</div>;
}

function AnimatedMetric({ value, visible }: { value: number; visible: boolean }) {
  const count = useMotionValue(0); const formatted = useTransform(count, (latest) => Math.round(latest).toLocaleString());
  useEffect(() => { if (visible) { const controls = animate(count, value, { duration: 1.35, ease: "easeOut" }); return () => controls.stop(); } }, [count, value, visible]);
  return <motion.span>{visible ? formatted : "0"}</motion.span>;
}
