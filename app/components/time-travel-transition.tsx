"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const monthLabels: Record<string, string> = {
  january: "January",
  february: "February",
  march: "March",
  april: "April",
  may: "May",
  june: "June",
  july: "July",
  august: "August",
  september: "September",
  october: "October",
  november: "November",
  december: "December"
};

function getExhibitLabel(pathname: string) {
  const match = pathname.match(/^\/(\d{4})\/([a-z]+)\/?$/);

  if (!match) {
    return null;
  }

  const [, year, month] = match;
  const monthLabel = monthLabels[month];

  return monthLabel ? `${monthLabel} ${year}` : null;
}

function shouldUseNativeNavigation(event: MouseEvent, anchor: HTMLAnchorElement) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    anchor.target === "_blank" ||
    anchor.hasAttribute("download")
  );
}

export function TimeTravelTransition() {
  const pathname = usePathname();
  const router = useRouter();
  const [destination, setDestination] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setDestination(null);
  }, [pathname]);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a");

      if (!(anchor instanceof HTMLAnchorElement) || shouldUseNativeNavigation(event, anchor)) {
        return;
      }

      const url = new URL(anchor.href, window.location.origin);

      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) {
        return;
      }

      const exhibitLabel = getExhibitLabel(url.pathname);

      if (!exhibitLabel) {
        return;
      }

      event.preventDefault();
      setDestination(exhibitLabel);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        router.push(`${url.pathname}${url.search}${url.hash}`);
      }, 850);
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [router]);

  if (!destination) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      aria-label={`Travelling to ${destination}`}
      className="fixed inset-0 z-50 grid place-items-center bg-zinc-950/88 px-5 text-stone-50 backdrop-blur-sm"
    >
      <div className="relative grid min-h-80 w-full max-w-xl place-items-center overflow-hidden border border-amber-200/20 bg-zinc-950/70 p-8 shadow-exhibit">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.08)_1px,transparent_1px)] bg-[size:100%_12px] opacity-20" />
        <div className="absolute h-64 w-64 rounded-full border border-amber-200/20 motion-safe:animate-[spin_1.5s_linear_infinite]" />
        <div className="absolute h-44 w-44 rounded-full border border-red-400/30 motion-safe:animate-[spin_1.1s_linear_infinite_reverse]" />
        <div className="absolute h-28 w-28 rotate-45 border border-stone-100/25 motion-safe:animate-[spin_2s_linear_infinite]" />
        <div className="absolute h-2 w-2 rotate-45 bg-amber-200 shadow-[0_0_34px_rgba(253,230,138,.85)]" />

        <div className="relative text-center">
          <p className="font-mono text-xs uppercase tracking-[0.34em] text-amber-200">Archive transit</p>
          <p className="mt-6 font-display text-4xl leading-none text-stone-50 md:text-6xl">Travelling to</p>
          <p className="mt-4 font-mono text-sm uppercase tracking-[0.28em] text-red-200">{destination}</p>
        </div>
      </div>
    </div>
  );
}
