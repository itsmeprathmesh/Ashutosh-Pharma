"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { Search, Menu, X, ClipboardList, MessageCircle, Plus, Moon, Sun } from "lucide-react";
import { BulkInquiryDialog } from "@/components/BulkInquiryDialog";
import { EnquiryListDrawer } from "@/components/EnquiryList";
import { site } from "@/config/site";

type Suggestion = { name: string; slug: string; category: { name: string } };
const nav = [{ href: "/", label: "Home" }, { href: "/about", label: "About Us" }, { href: "/shop", label: "Shop" }, { href: "/oncology", label: "Oncology" }, { href: "/blog", label: "Blogs" }, { href: "/contact", label: "Contact Us" }];
export function PublicHeader() {
  const [mobile, setMobile] = useState(false); const [drawer, setDrawer] = useState(false); const [bulk, setBulk] = useState(false); const [dark, setDark] = useState(false);
  const [count, setCount] = useState(0); const [q, setQ] = useState(""); const [category, setCategory] = useState(""); const [categories, setCategories] = useState<{ name: string; slug: string }[]>([]); const [results, setResults] = useState<Suggestion[]>([]); const [scrolled, setScrolled] = useState(false);
  useEffect(() => { fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories ?? [])).catch(() => {}); const saved = localStorage.getItem("ashutosh-theme"); const useDark = saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches; document.documentElement.dataset.theme = useDark ? "dark" : "light"; setDark(useDark); const refresh = () => { try { setCount(JSON.parse(localStorage.getItem("ashutosh-enquiry-list") ?? "[]").length); } catch { setCount(0); } }; const scroll = () => setScrolled(window.scrollY > 20); refresh(); scroll(); window.addEventListener("enquiry-list-change", refresh); window.addEventListener("scroll", scroll, { passive: true }); return () => { window.removeEventListener("enquiry-list-change", refresh); window.removeEventListener("scroll", scroll); }; }, []);
  useEffect(() => { const timer = setTimeout(() => { if (q.trim().length < 2) { setResults([]); return; } fetch(`/api/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`).then((r) => r.json()).then((data) => setResults(data.products ?? [])).catch(() => setResults([])); }, 300); return () => clearTimeout(timer); }, [q, category]);
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header className={`site-header ${scrolled ? "is-scrolled" : ""}`}><div className="container header-main">
      <button className="icon-button mobile-menu" aria-label={mobile ? "Close menu" : "Open menu"} onClick={() => setMobile(!mobile)}>{mobile ? <X /> : <Menu />}</button>
      <Link className="brand" href="/" aria-label={`${site.name} home`}><Image className="brand-logo" src="/ashutosh-pharma-logo.png" alt="Ashutosh Pharma — Wholesale & Export, Nagpur, India" width={842} height={240} priority/></Link>
      <div className="header-search"><Search aria-hidden="true" size={18}/><input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") window.location.href = `/shop?q=${encodeURIComponent(q)}&cat=${encodeURIComponent(category)}`; if (e.key === "Escape") setResults([]); }} placeholder="Search medicines and products" aria-label="Search products"/>{results.length > 0 && <div className="search-results" role="listbox">{results.map((item) => <Link key={item.slug} href={`/product/${item.slug}`} onClick={() => { setResults([]); setQ(""); }}><span>{item.name}</span><small>{item.category.name}</small></Link>)}</div>}</div>
      <div className="header-actions"><button className="button button-small" onClick={() => setBulk(true)}>Bulk Inquiry <Plus size={15}/></button><button className="icon-button theme-toggle" aria-label={dark ? "Switch to light mode" : "Switch to dark mode"} onClick={() => { const next = !dark; setDark(next); document.documentElement.dataset.theme = next ? "dark" : "light"; localStorage.setItem("ashutosh-theme", next ? "dark" : "light"); }}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button><button className="icon-button enquiry-count" aria-label={`Enquiry list, ${count} products`} onClick={() => setDrawer(true)}><ClipboardList/><span>{count}</span></button></div>
      {mobile && <button className="mobile-nav-backdrop" aria-label="Close navigation" onClick={() => setMobile(false)}/>}<nav className={`main-nav ${mobile ? "mobile-open" : ""}`} aria-label="Main navigation"><button className="icon-button mobile-menu-close" onClick={() => setMobile(false)} aria-label="Close navigation"><X/></button><label className="nav-category-filter"><select aria-label="Browse by category" value={category} onChange={(e) => { const slug = e.target.value; setCategory(slug); window.location.href = slug ? `/shop?cat=${encodeURIComponent(slug)}` : "/shop"; }}><option value="">All categories</option>{categories.map((cat) => <option value={cat.slug} key={cat.slug}>{cat.name}</option>)}</select></label>{nav.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobile(false)}>{item.label}</Link>)}<button className="button button-small mobile-bulk" onClick={() => { setBulk(true); setMobile(false); }}>Bulk Inquiry</button></nav>
    </div></header>
    <EnquiryListDrawer open={drawer} onClose={() => setDrawer(false)}/>
    {bulk && <BulkInquiryDialog onClose={() => setBulk(false)}/>}
  </>;
}

export function FloatingWhatsApp() { return <a className="whatsapp-float" href={`https://wa.me/${site.whatsapp}`} aria-label="Contact Ashutosh Pharma on WhatsApp" target="_blank" rel="noreferrer"><MessageCircle/><span>WhatsApp</span></a>; }
