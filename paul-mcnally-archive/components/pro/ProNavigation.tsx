"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function ProNavigation() {
  const pathname = usePathname();
  const links = [{ label: "Work", href: "/pro/work" }, { label: "About", href: "/pro/about" }, { label: "Contact", href: "/pro/contact" }];
  return <nav className="pro-navigation" aria-label="Main navigation">
    {links.map(({ label, href }) => {
      const active = href === "/pro/work"
        ? /^\/pro\/(work|features|interviews|reviews|blog)(\/|$)/.test(pathname)
        : pathname === href;
      return <Link href={href} key={href} aria-current={active ? "page" : undefined}>{label}</Link>;
    })}
    <Link href="/pro/contact" className="pro-nav-contact">Get in touch</Link>
  </nav>;
}

export function EditionLink() {
  const pathname = usePathname();
  const terminalPath = pathname === "/pro" ? "/" : pathname.replace(/^\/pro/, "");
  return <Link href={terminalPath}>Micronet edition</Link>;
}
