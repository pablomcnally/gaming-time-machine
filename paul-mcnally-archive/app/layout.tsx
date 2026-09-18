import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import { SitePresentation } from "../components/SitePresentation";
import { StructuredData } from "../components/StructuredData";
import { getBlogKeyboardPages } from "../lib/blog";
import { getPortfolioKeyboardPages } from "../lib/portfolio";
import { SITE_URL } from "../lib/site";
import { personStructuredData } from "../lib/structuredData";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Paul McNally | Games & Technology Journalist",
    template: "%s | Paul McNally"
  },
  description:
    "Games and technology journalism, interviews, reviews and editorial work by Paul McNally, spanning three decades across print and digital publishing.",
  applicationName: "Paul McNally",
  manifest: "/site.webmanifest",
  openGraph: {
    title: "Paul McNally | Games & Technology Journalist",
    description:
      "Games and technology journalism, interviews, reviews and editorial work by Paul McNally, spanning three decades across print and digital publishing.",
    url: SITE_URL,
    siteName: "Paul McNally",
    images: [{ url: "/og.svg", width: 1200, height: 630, alt: "Paul McNally, games and technology journalist" }],
    locale: "en_GB",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Paul McNally | Games & Technology Journalist",
    description: "Games and technology journalism, interviews, reviews and editorial work by Paul McNally.",
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
        <StructuredData data={personStructuredData} />
        <Script id="crt-frame-preference" strategy="beforeInteractive">
          {`try{if(localStorage.getItem("paul-mcnally-crt-frame")==="off"){document.documentElement.classList.add("crt-frame-off")}}catch(e){}`}
        </Script>
        <Script id="pablonet-connection-session" strategy="beforeInteractive">
          {`try{if(sessionStorage.getItem("paul-mcnally-prestel-connected")==="true"){document.documentElement.classList.add("pablonet-connected")}}catch(e){}`}
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
