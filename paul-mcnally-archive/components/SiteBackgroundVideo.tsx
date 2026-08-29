"use client";

import { useEffect, useRef } from "react";

export function SiteBackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

    if (!video) {
      return;
    }

    const syncPlayback = () => {
      if (reducedMotion.matches) {
        video.pause();
        return;
      }

      void video.play().catch(() => {
        // The poster remains visible if a browser declines muted autoplay.
      });
    };

    syncPlayback();
    reducedMotion.addEventListener("change", syncPlayback);

    return () => reducedMotion.removeEventListener("change", syncPlayback);
  }, []);

  return (
    <div className="site-background-video" aria-hidden="true">
      <video
        ref={videoRef}
        className="site-background-video__media"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        poster="/media/pablonet-space-invaders-poster.webp"
        tabIndex={-1}
        disablePictureInPicture
      >
        <source src="/media/pablonet-space-invaders-background.mp4" type="video/mp4" />
      </video>
      <div className="site-background-video__fallback" />
    </div>
  );
}
