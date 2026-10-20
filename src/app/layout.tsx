import type { Metadata } from "next";
import Script from "next/script";
import { SiteFooter } from "@/components/SiteFooter";
import { PublicHeader, FloatingWhatsApp } from "@/components/PublicHeader";
import { site } from "@/config/site";
import "./globals.css";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-KB7PJB2EG9"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];\nfunction gtag(){window.dataLayer.push(arguments);}\ngtag('js', new Date());\ngtag('config', 'G-KB7PJB2EG9');`}
        </Script>
        <PublicHeader />
        {children}
        <SiteFooter />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
