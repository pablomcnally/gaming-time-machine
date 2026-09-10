"use client";

import { useState } from "react";

type AudioArchivePlayerProps = {
  audioUrl: string;
  duration: string;
  title: string;
};

const meterBars = Array.from({ length: 21 }, (_, index) => index);

export function AudioArchivePlayer({ audioUrl, duration, title }: AudioArchivePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <figure className="portfolio-media portfolio-audio">
      <div className="portfolio-audio-player">
        <p className="portfolio-audio-kicker">Audio archive // {duration}</p>
        <strong>{title}</strong>
        <div className="portfolio-audio-visualizer" data-playing={isPlaying ? "true" : "false"} aria-hidden="true">
          <span className="portfolio-audio-monitor-label">
            Micronet audio monitor // {isPlaying ? "signal active" : "standby"}
          </span>
          <div className="portfolio-audio-spectrum">
            {meterBars.map((bar) => (
              <span className={`portfolio-audio-bar portfolio-audio-bar-${(bar % 5) + 1}`} key={bar} />
            ))}
          </div>
          <div className="portfolio-hal-eye-shell">
            <span className="portfolio-hal-eye" />
          </div>
        </div>
        <span className="sr-only" aria-live="polite">{isPlaying ? "Audio playing" : "Audio paused"}</span>
        <audio
          aria-label={title}
          controls
          onEnded={() => setIsPlaying(false)}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
          preload="metadata"
          src={audioUrl}
        >
          <a href={audioUrl}>Open the audio file</a>
        </audio>
      </div>
      <figcaption>
        {title} // <a href={audioUrl} rel="noreferrer" target="_blank">Open audio file</a>
      </figcaption>
    </figure>
  );
}
