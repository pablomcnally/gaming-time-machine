"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { navigationItems } from "../data/site";

const PAGE_ENTRY_TIMEOUT = 1200;

type KeyboardPage = {
  number: string;
  href: string;
};

export function RetroNavigation({ contentKeyboardPages }: { contentKeyboardPages: KeyboardPage[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pageEntry, setPageEntry] = useState("");
  const pageBufferRef = useRef("");
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    function clearResetTimer() {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
        resetTimerRef.current = null;
      }
    }

    function scheduleReset(delay = PAGE_ENTRY_TIMEOUT) {
      clearResetTimer();
      resetTimerRef.current = window.setTimeout(() => {
        pageBufferRef.current = "";
        setPageEntry("");
      }, delay);
    }

    function onKeyDown(event: KeyboardEvent) {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);

      if (isTyping) {
        return;
      }

      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.repeat || !/^\d$/.test(event.key)) {
        return;
      }

      event.preventDefault();
      clearResetTimer();

      const nextEntry = `${pageBufferRef.current}${event.key}`;
      pageBufferRef.current = nextEntry;
      setPageEntry(nextEntry);

      if (nextEntry.length < 3) {
        scheduleReset();
        return;
      }

      const keyboardPages: KeyboardPage[] = [
        ...navigationItems,
        ...contentKeyboardPages,
        { number: "800", href: "/micronet-800" },
        { number: "999", href: "/system-status" }
      ];
      const item = keyboardPages.find((navItem) => navItem.number === nextEntry);
      pageBufferRef.current = "";

      if (item) {
        scheduleReset(350);
        router.push(item.href);
      } else {
        setPageEntry("???");
        scheduleReset(700);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearResetTimer();
    };
  }, [contentKeyboardPages, router]);

  return (
    <>
      <nav aria-label="Main navigation" className="teletext-navigation bg-terminal-blue">
        <div className="teletext-nav-grid mx-auto grid max-w-7xl gap-1 px-3 py-2 sm:px-4">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={`Page ${item.number}: ${item.label}`}
              className={`teletext-nav-link min-h-10 whitespace-nowrap px-1 py-1 text-center uppercase transition hover:bg-terminal-yellow hover:text-terminal-black ${
                isActive ? "text-terminal-yellow" : "text-terminal-paper"
              }`}
            >
              <span aria-hidden="true">{item.number}: </span>
              {item.label}
            </Link>
          );
        })}
        </div>
      </nav>
      {pageEntry ? (
        <div
          aria-label={pageEntry === "???" ? "Unknown page code" : `Page code ${pageEntry}`}
          aria-live="polite"
          className="teletext-page-entry"
          role="status"
        >
          <span>PAGE</span>
          <strong aria-hidden="true">{pageEntry === "???" ? pageEntry : pageEntry.padEnd(3, "_")}</strong>
        </div>
      ) : null}
    </>
  );
}
