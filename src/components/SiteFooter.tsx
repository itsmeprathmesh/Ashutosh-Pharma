"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ArrowUpRight } from "lucide-react";
import { site } from "@/config/site";
import type { HeaderCategory } from "@/components/PublicHeader";

export function SiteFooter({ categories = [] }: { categories?: HeaderCategory[] }) {
  const [status, setStatus] = useState("");
  async function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const email = new FormData(form).get("email");
    try {
      const response = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      setStatus(response.ok ? "Thank you. You are subscribed." : "Please check your email address.");
      if (response.ok) form.reset();
    } catch { setStatus("Subscription is temporarily unavailable."); }
  }

  return <footer className="site-footer">
    <div className="container footer-grid">
      <section className="footer-company"><Link className="footer-brand" href="/">{site.name}</Link><p className="footer-intro">Pharmaceutical trade enquiries for importers, distributors and institutional buyers.</p><address>{site.address}</address></section>
      <nav aria-label="Shop links"><h2>Shop</h2><Link href="/shop">Full catalogue</Link><Link href="/oncology">Oncology</Link><Link href="/blog">Trade journal</Link><Link href="/about">About us</Link><Link href="/contact">Contact</Link></nav>
      <nav className="footer-categories" aria-label="Product categories"><h2>Categories</h2>{categories.length ? categories.map((category) => <Link key={category.slug} href={`/shop?cat=${category.slug}`}>{category.name}<small>{category._count.products.toLocaleString("en-IN")}</small></Link>) : <Link href="/shop">Browse the catalogue</Link>}</nav>
      <section className="footer-contact"><h2>Contact</h2><a href={`mailto:${site.email}`}>{site.email}<ArrowUpRight size={13}/></a><a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp {site.phone}<ArrowUpRight size={13}/></a><form className="subscribe-form" onSubmit={subscribe}><label htmlFor="subscribe-email">Trade updates</label><div><input className="field" id="subscribe-email" name="email" type="email" placeholder="Business email" maxLength={254} required/><button className="button button-small" type="submit">Subscribe</button></div><small role="status">{status}</small></form></section>
    </div>
    <div className="container footer-disclaimer">
      {site.drugLicenceNumber && <p>Drug licence no. {site.drugLicenceNumber}</p>}
      <p>For professional trade enquiries only. Product availability, documentation and destination requirements are confirmed for each enquiry.</p>
    </div>
    <div className="container footer-bottom"><span>© {new Date().getFullYear()} {site.name}</span><nav aria-label="Legal links"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/refund-policy">Refund policy</Link></nav></div>
  </footer>;
}
