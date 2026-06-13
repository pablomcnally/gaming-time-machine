"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "paul-mcnally-crt-frame";

export function CrtFrameToggle() {
  const [isOn, setIsOn] = useState(true);

  useEffect(() => {
    setIsOn(!document.documentElement.classList.contains("crt-frame-off"));
  }, []);

  function toggleFrame() {
    const nextValue = !isOn;
    document.documentElement.classList.toggle("crt-frame-off", !nextValue);
    setIsOn(nextValue);

    try {
      window.localStorage.setItem(STORAGE_KEY, nextValue ? "on" : "off");
    } catch {
      // The visual toggle still works if storage is unavailable.
    }
  }

  return (
    <button
      aria-label={isOn ? "Turn CRT frame off" : "Turn CRT frame on"}
      aria-pressed={isOn}
      className="border border-terminal-cyan/55 px-2 py-1 text-terminal-cyan transition hover:border-terminal-yellow hover:text-terminal-yellow"
      onClick={toggleFrame}
      type="button"
    >
      CRT {isOn ? "ON" : "OFF"}
    </button>
  );
}
