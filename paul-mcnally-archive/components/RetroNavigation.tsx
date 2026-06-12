"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { navigationItems } from "../data/site";

export function RetroNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) {
        return;
      }

      const item = navigationItems.find((navItem) => navItem.number === event.key);

      if (item) {
        router.push(item.href);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [router]);

  return (
    <nav aria-label="Main navigation" className="bg-terminal-blue">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2 sm:px-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`min-h-9 flex-[1_1_30%] whitespace-nowrap px-2 py-1 text-center font-mono text-base uppercase tracking-wide transition hover:bg-terminal-yellow hover:text-terminal-black sm:min-w-28 sm:flex-1 sm:text-xl ${
                isActive ? "text-terminal-yellow" : "text-terminal-paper"
              }`}
            >
              <span aria-hidden="true">{item.number}: </span>
              {item.label}
            </Link>
          );
        })}
        <span className="hidden px-3 py-1 text-xl text-terminal-yellow lg:block">HELP</span>
      </div>
    </nav>
  );
}
