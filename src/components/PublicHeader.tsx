"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ClipboardList, Menu, Search, X } from "lucide-react";
import { BulkInquiryDialog } from "@/components/BulkInquiryDialog";
import { EnquiryListDrawer } from "@/components/EnquiryList";
import { site } from "@/config/site";

export type HeaderCategory = {
  id: number;
  name: string;
  slug: string;
  imageUrl: string | null;
  _count: { products: number };
};

const primaryLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/shop", label: "Shop" },
  { href: "/#offers", label: "Offers", offer: true },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export function PublicHeader({ categories = [], hasOffers = false }: { categories?: HeaderCategory[]; hasOffers?: boolean }) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [mobile, setMobile] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [count, setCount] = useState(0);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [results, setResults] = useState<{ name: string; slug: string; category: { name: string } }[]>([]);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const refresh = () => {
      try { setCount(JSON.parse(localStorage.getItem("ashutosh-enquiry-list") ?? "[]").length); }
      catch { setCount(0); }
    };
    const onScroll = () => setScrolled(window.scrollY > 18);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { setCategoriesOpen(false); setMobile(false); } };
    refresh(); onScroll();
    window.addEventListener("enquiry-list-change", refresh);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("enquiry-list-change", refresh);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (q.trim().length < 2) { setResults([]); return; }
      fetch(`/api/products?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`)
        .then((response) => response.json())
        .then((data) => setResults(data.products ?? []))
        .catch(() => setResults([]));
    }, 240);
    return () => window.clearTimeout(timer);
  }, [q, category]);

  useEffect(() => {
    if (!categoriesOpen) return;
    const closeOutside = (event: MouseEvent) => { if (!menuRef.current?.contains(event.target as Node)) setCategoriesOpen(false); };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [categoriesOpen]);

  const links = primaryLinks.filter((item) => !item.offer || hasOffers);
  const search = () => router.push(`/shop?${new URLSearchParams({ ...(q.trim() && { q: q.trim() }), ...(category && { cat: category }) })}`);

  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <div className="contact-strip">
      <div className="container contact-strip-inner">
        <span>Nagpur, India</span><span className="strip-divider" aria-hidden="true">/</span>
        <a href={`mailto:${site.email}`}>{site.email}</a><span className="strip-divider" aria-hidden="true">/</span>
        <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noreferrer">WhatsApp {site.phone}</a>
      </div>
    </div>
    <header className={`site-header ${scrolled ? "is-scrolled" : ""} ${mobile ? "menu-open" : ""}`}>
      <div className="container header-main">
        <button className="icon-button mobile-menu" aria-label={mobile ? "Close menu" : "Open menu"} aria-expanded={mobile} onClick={() => setMobile((value) => !value)}>{mobile ? <X size={20}/> : <Menu size={20}/>}</button>
        <Link className="brand" href="/" aria-label={`${site.name} home`}><Image className="brand-logo" src="/ashutosh-pharma-logo.png" alt="Ashutosh Pharma — Wholesale and Export" width={842} height={240} priority/></Link>

        <div className="header-search-wrap">
          <form className="header-search" onSubmit={(event) => { event.preventDefault(); search(); }}>
            <label className="search-category"><span className="sr-only">Search category</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">All categories</option>{categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label>
            <span className="search-divider" aria-hidden="true"/>
            <Search size={17} aria-hidden="true"/>
            <input value={q} onChange={(event) => setQ(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") setResults([]); }} placeholder="Search medicines and products" aria-label="Search medicines and products" autoComplete="off"/>
            <button type="submit" className="search-submit">Search</button>
          </form>
          {results.length > 0 && <div className="search-results" role="listbox">{results.map((item) => <Link key={item.slug} href={`/product/${item.slug}`} role="option" onClick={() => { setResults([]); setQ(""); }}><span>{item.name}</span><small>{item.category.name}</small></Link>)}</div>}
        </div>

        <div className="header-actions">
          <button className="icon-button enquiry-count" aria-label={`Enquiry list, ${count} products`} onClick={() => setDrawer(true)}><ClipboardList size={19}/><span>{count}</span></button>
          <button className="button button-small header-bulk" onClick={() => setBulk(true)}>Bulk enquiry</button>
        </div>

        <nav className={`main-nav ${mobile ? "mobile-open" : ""}`} aria-label="Main navigation">
          <div className="category-menu" ref={menuRef}>
            <button className="all-categories-button" aria-expanded={categoriesOpen} aria-controls="category-mega-menu" onClick={() => setCategoriesOpen((value) => !value)}>All categories <ChevronDown size={15}/></button>
            {categoriesOpen && <div className="category-mega-menu" id="category-mega-menu"><div className="mega-menu-heading"><div><span className="eyebrow">Browse the catalogue</span><h2>All categories</h2></div><Link href="/shop" onClick={() => setCategoriesOpen(false)}>View shop <ChevronRight size={15}/></Link></div>{categories.length ? <div className="mega-category-grid">{categories.map((item) => <Link key={item.id} href={`/shop?cat=${item.slug}`} onClick={() => setCategoriesOpen(false)}><span>{item.name}</span><small>{item._count.products.toLocaleString("en-IN")} products</small></Link>)}</div> : <p className="menu-empty">Categories will appear when the catalogue is available.</p>}</div>}
          </div>
          {links.map((item) => <Link key={item.href} href={item.href} onClick={() => setMobile(false)}>{item.label}</Link>)}
          <button className="button button-small mobile-bulk" onClick={() => { setBulk(true); setMobile(false); }}>Bulk enquiry</button>
        </nav>
      </div>
      {mobile && <button className="mobile-nav-backdrop" aria-label="Close navigation" onClick={() => setMobile(false)}/>}
    </header>
    <EnquiryListDrawer open={drawer} onClose={() => setDrawer(false)}/>
    {bulk && <BulkInquiryDialog onClose={() => setBulk(false)}/>}
  </>;
}

export function FloatingWhatsApp() {
  return <a className="whatsapp-float" href={`https://wa.me/${site.whatsapp}`} aria-label="Contact Ashutosh Pharma on WhatsApp" target="_blank" rel="noreferrer"><span>WhatsApp</span></a>;
}
