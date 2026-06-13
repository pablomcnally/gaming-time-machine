"use client";

import { useEffect, useState } from "react";
import { CrtFrameToggle } from "./CrtFrameToggle";
import { ModemSoundToggle } from "./ModemSoundToggle";
import { RetroNavigation } from "./RetroNavigation";

function formatDate(now: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(now);
}

function formatServiceDate(now: Date) {
  return formatDate(now).replaceAll(",", "").toUpperCase();
}

function formatTime(now: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Europe/London"
  }).format(now);
}

export function SiteHeader() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-terminal-black/95 font-mono uppercase shadow-terminal backdrop-blur">
      <div className="mx-auto grid max-w-7xl gap-2 border-b border-terminal-paper/80 px-3 py-2 text-sm sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:px-4 md:text-base">
        <p className="text-terminal-green">*** MICRONET 800 SERVICES ***</p>
        <p className="text-terminal-paper sm:text-center">Personal Archive Terminal</p>
        <div className="flex flex-wrap items-center gap-2 text-terminal-green sm:justify-end">
          <p className="sm:text-right">{now ? `${formatTime(now)}  ${formatServiceDate(now)}` : "--:--  --- -- --- ----"}</p>
          <CrtFrameToggle />
          <ModemSoundToggle />
        </div>
      </div>
      <RetroNavigation />
    </header>
  );
}
