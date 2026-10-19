import Link from "next/link";
import { site } from "@/config/site";

const links = [
  { href: "/shop", label: "Catalog" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link className="brand" href="/" aria-label={`${site.name} home`}>
          <span className="brand-mark" aria-hidden="true">A</span>
          <span className="brand-copy">
            <strong>{site.name}</strong>
            <small>PHARMACEUTICAL EXPORTS</small>
          </span>
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          {links.map((link) => (
            <Link key={link.href} href={link.href}>{link.label}</Link>
          ))}
        </nav>
        <Link className="button button-small header-cta" href="/contact">
          Request a quote <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}
