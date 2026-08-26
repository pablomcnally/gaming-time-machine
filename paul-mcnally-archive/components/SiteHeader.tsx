"use client";

import { useEffect, useState } from "react";
import { BackgroundMusicToggle } from "./BackgroundMusicToggle";
import { CrtFrameToggle } from "./CrtFrameToggle";
import { ModemSoundToggle } from "./ModemSoundToggle";
import { RetroNavigation } from "./RetroNavigation";

type KeyboardPage = {
  number: string;
  href: string;
};

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

export function SiteHeader({ contentKeyboardPages }: { contentKeyboardPages: KeyboardPage[] }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <header className="site-header sticky top-0 z-40 bg-terminal-black/95 font-mono uppercase shadow-terminal backdrop-blur">
      <div className="site-header-grid mx-auto max-w-7xl border-b border-terminal-paper/80">
        <p className="text-terminal-green">*** PABLONET 800 SERVICES ***</p>
        <p className="site-header-title text-terminal-paper">Personal Archive Terminal</p>
        <div className="site-header-meta text-terminal-green">
          <p className="site-header-clock">{now ? `${formatTime(now)}  ${formatServiceDate(now)}` : "--:--  --- -- --- ----"}</p>
          <div className="site-header-controls">
            <CrtFrameToggle />
            <ModemSoundToggle />
            <BackgroundMusicToggle />
          </div>
        </div>
      </div>
      <RetroNavigation contentKeyboardPages={contentKeyboardPages} />
    </header>
  );
}
