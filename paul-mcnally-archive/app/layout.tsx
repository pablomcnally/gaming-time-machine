import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { SitePresentation } from "../components/SitePresentation";
import { getBlogKeyboardPages } from "../lib/blog";
import { getPortfolioKeyboardPages } from "../lib/portfolio";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://paul-mcnally-archive.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Paul McNally | Personal Archive Terminal",
    template: "%s | Paul McNally"
  },
  description:
    "A modern personal archive for Paul McNally, games journalist, editor, writer, retro enthusiast, and former magazine journalist.",
  applicationName: "Paul McNally Personal Archive",
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Paul McNally | Personal Archive Terminal",
    description:
      "Pablonet, Prestel and Teletext energy rebuilt as a readable personal archive for a games journalist.",
    url: siteUrl,
    siteName: "Paul McNally Personal Archive",
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "Paul McNally personal archive terminal" }],
    locale: "en_GB",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Paul McNally | Personal Archive Terminal",
    description: "A games journalist's personal archive, presented through the Pablonet terminal.",
    images: ["/og.svg"]
  },
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const contentKeyboardPages = [...getPortfolioKeyboardPages(), ...getBlogKeyboardPages()];

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <Script id="crt-frame-preference" strategy="beforeInteractive">
          {`try{if(localStorage.getItem("paul-mcnally-crt-frame")==="off"){document.documentElement.classList.add("crt-frame-off")}}catch(e){}`}
        </Script>
        <SitePresentation contentKeyboardPages={contentKeyboardPages}>
          {children}
        </SitePresentation>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
