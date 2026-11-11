import type { Metadata } from "next";
import { IBM_Plex_Mono, Public_Sans, Source_Serif_4 } from "next/font/google";
import Script from "next/script";
import { headers } from "next/headers";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SiteFooter } from "@/components/SiteFooter";
import { PublicHeader, FloatingWhatsApp } from "@/components/PublicHeader";
import { site } from "@/config/site";
import { db } from "@/lib/db";
import { safeDatabaseQuery } from "@/lib/db-safe";
import { getPublicCategories } from "@/lib/public-data";
import type { HeaderCategory } from "@/components/PublicHeader";
import "@/styles/tokens.css";
import "./globals.css";

const sourceSerif = Source_Serif_4({ subsets: ["latin"], variable: "--font-source-serif", display: "swap" });
const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });
const ibmPlexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-ibm-plex-mono", weight: ["400", "500", "600"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: `${site.name} | Pharmaceutical Exports`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  icons: { icon: "/ashutosh-pharma-icon.png", shortcut: "/ashutosh-pharma-icon.png" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: site.name,
    title: `${site.name} | Pharmaceutical Exports`,
    description: site.description,
  },
  twitter: { card: "summary_large_image", title: `${site.name} | Pharmaceutical Exports`, description: site.description },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const categories: HeaderCategory[] = process.env.DATABASE_URL
    ? await safeDatabaseQuery(() => getPublicCategories(), [])
    : [];
  const hasOffers = process.env.DATABASE_URL
    ? Boolean(await safeDatabaseQuery(() => db.offer.findFirst({ where: { active: true, OR: [{ validUntil: null }, { validUntil: { gte: new Date() } }] }, select: { id: true } }), null))
    : false;
  return (
    <html lang="en" className={`${sourceSerif.variable} ${publicSans.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KB7PJB2EG9"
          strategy="afterInteractive"
          nonce={nonce}
        />
        <Script id="google-analytics" strategy="afterInteractive" nonce={nonce}>
          {`window.dataLayer = window.dataLayer || [];\nfunction gtag(){window.dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-KB7PJB2EG9');`}
        </Script>
        <PublicHeader categories={categories} hasOffers={hasOffers}/>
        {children}
        <SiteFooter categories={categories}/>
        <FloatingWhatsApp />
        <SpeedInsights />
      </body>
    </html>
  );
}
