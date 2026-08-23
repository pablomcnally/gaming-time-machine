"use client";

import { useEffect, useState } from "react";

const konami = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];

export function EasterEggs() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [messageVisible, setMessageVisible] = useState(false);

  useEffect(() => {
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

      const key = event.key;

      const nextSequence = [...sequence, key].slice(-konami.length);
      setSequence(nextSequence);

      if (nextSequence.join(",") === konami.join(",")) {
        setMessageVisible(true);
        window.setTimeout(() => setMessageVisible(false), 5000);
      }
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [sequence]);

  if (!messageVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,34rem)] -translate-x-1/2 border border-terminal-yellow bg-terminal-black p-4 text-center font-mono text-sm uppercase text-terminal-yellow shadow-terminal">
      Hidden message unlocked: deadlines are temporary, archive pages are forever.
    </div>
  );
}
