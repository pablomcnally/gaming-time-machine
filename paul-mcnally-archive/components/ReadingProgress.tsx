"use client";

import { useEffect, useState } from "react";

export function ReadingProgress({ targetId }: { targetId: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let frame = 0;

    function updateProgress() {
      const target = document.getElementById(targetId);

      if (!target) return;

      const articleTop = window.scrollY + target.getBoundingClientRect().top;
      const scrollableDistance = Math.max(1, target.offsetHeight - window.innerHeight);
      const nextProgress = Math.min(1, Math.max(0, (window.scrollY - articleTop) / scrollableDistance));

      setProgress(nextProgress);
    }

    function scheduleUpdate() {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateProgress);
    }

    updateProgress();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [targetId]);

  return (
    <div aria-hidden="true" className="reading-progress">
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  );
}
