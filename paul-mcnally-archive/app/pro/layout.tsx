import type { Metadata } from "next";
import Link from "next/link";
import { ProNavigation, EditionLink } from "../../components/pro/ProNavigation";
import "./professional.css";

export const metadata: Metadata = {
  title: { default: "Paul McNally | Games & Technology Journalist", template: "%s | Paul McNally" },
  description: "Games and technology journalism, interviews, reviews and editorial work by Paul McNally.",
  applicationName: "Paul McNally Portfolio",
  icons: { icon: "/pro-favicon.svg" },
  openGraph: {
    title: "Paul McNally | Journalist & Editor",
    description: "Three decades of stories about games, technology and the people behind them.",
    url: "/pro", siteName: "Paul McNally", type: "website", locale: "en_GB",
    images: [{ url: "/archive/amberstar/amberstar_featured.jpg.webp", alt: "Paul McNally's original Amberstar review notes and game" }]
  },
  twitter: { card: "summary_large_image", title: "Paul McNally | Journalist & Editor", description: "Games. Technology. Culture.", images: ["/archive/amberstar/amberstar_featured.jpg.webp"] }
};

export default function ProfessionalLayout({ children }: { children: React.ReactNode }) {
  return <div className="pro-site">
    <a className="pro-skip-link" href="#pro-main">Skip to content</a>
    <header className="pro-header"><div className="pro-container pro-header-inner">
      <Link href="/pro" className="pro-brand" aria-label="Paul McNally, portfolio home">Paul McNally<span>Journalist &amp; editor</span></Link>
      <ProNavigation />
    </div></header>
    <main id="pro-main" tabIndex={-1}>{children}</main>
    <footer className="pro-footer"><div className="pro-container">
      <div className="pro-footer-invitation"><div><p className="pro-eyebrow">A story worth telling?</p><h2>Let&apos;s talk.</h2></div><Link className="pro-button" href="/pro/contact">Get in touch</Link></div>
      <div className="pro-footer-bottom"><p>Paul McNally <span>Games. Technology. Culture.</span></p><nav aria-label="Footer"><Link href="/pro/work">Work</Link><Link href="/pro/about">About</Link><Link href="/pro/contact">Contact</Link><EditionLink /></nav></div>
    </div></footer>
  </div>;
}
