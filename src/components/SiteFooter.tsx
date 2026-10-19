"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { site } from "@/config/site";

export function SiteFooter() {
  const [status, setStatus] = useState("");
  const [categories, setCategories] = useState<{ name:string; slug:string }[]>([]);
  useEffect(() => { fetch("/api/categories").then((response) => response.json()).then((data) => setCategories(data.categories ?? [])).catch(() => {}); }, []);
  async function subscribe(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; const email = new FormData(form).get("email"); const response = await fetch("/api/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) }); setStatus(response.ok ? "Thanks for subscribing." : "Please enter a valid email."); if (response.ok) form.reset(); }
  return <footer className="site-footer"><div className="container footer-grid">
    <div><Link className="footer-brand" href="/">{site.name}</Link><p className="footer-intro">B2B pharmaceutical procurement and export enquiries for licensed importers and institutional buyers.</p><p className="footer-location">{site.address}</p></div>
    <div><h2>Information</h2><Link href="/shop">Shop</Link><Link href="/terms">Terms</Link><Link href="/refund-policy">Refund policy</Link><Link href="/privacy">Privacy</Link></div>
    <div><h2>Categories</h2>{categories.length ? categories.map((category) => <Link key={category.slug} href={`/shop?cat=${category.slug}`}>{category.name}</Link>) : <Link href="/shop">Browse catalogue</Link>}</div>
    <div><h2>Contact</h2><a href={`mailto:${site.email}`}>{site.email}</a><a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp {site.phone}</a><p className="footer-note">For licensed trade buyers only. Product availability and destination requirements are confirmed during enquiry.</p><form className="subscribe-form" onSubmit={subscribe}><label htmlFor="subscribe-email">Trade updates</label><div><input className="field" id="subscribe-email" name="email" type="email" placeholder="Business email" required/><button className="button button-small">Subscribe</button></div><small role="status">{status}</small></form></div>
  </div><div className="container footer-bottom"><span>© {new Date().getFullYear()} {site.name}</span><span>Drug licence no: {site.drugLicenceNumber}</span></div></footer>;
}
