"use client";

import { usePathname } from "next/navigation";
import { CrtDisplayShell } from "./CrtDisplayShell";
import { EasterEggs } from "./EasterEggs";
import { FooterStatusBar } from "./FooterStatusBar";
import { SiteBackgroundVideo } from "./SiteBackgroundVideo";
import { SiteHeader } from "./SiteHeader";

export function SitePresentation({ children, contentKeyboardPages }: {
  children: React.ReactNode;
  contentKeyboardPages: Array<{ number: string; href: string }>;
}) {
  const pathname = usePathname();

  // Do not mount terminal media, hotkeys or effects in the professional edition.
  if (pathname === "/pro" || pathname.startsWith("/pro/")) return <>{children}</>;

  return <>
    <SiteBackgroundVideo />
    <CrtDisplayShell>
      <SiteHeader contentKeyboardPages={contentKeyboardPages} />
      {children}
      <FooterStatusBar />
    </CrtDisplayShell>
    <EasterEggs />
  </>;
}
