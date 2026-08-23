"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MUSIC_SRC = "/audio/ceefax-chillin-loop.mp3";
const MUSIC_VOLUME = 0.2;
const STORAGE_KEY = "paul-mcnally-background-music";

export function BackgroundMusicToggle() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const enabledRef = useRef(false);

  const ensureAudio = useCallback(() => {
    if (!audioRef.current) {
      const music = new Audio(MUSIC_SRC);
      music.loop = true;
      music.preload = "none";
      music.volume = MUSIC_VOLUME;
      music.addEventListener("play", () => setIsPlaying(true));
      music.addEventListener("pause", () => setIsPlaying(false));
      audioRef.current = music;
    }

    return audioRef.current;
  }, []);

  const startMusic = useCallback(async () => {
    if (!enabledRef.current) {
      return false;
    }

    try {
      await ensureAudio().play();
      return true;
    } catch {
      setIsPlaying(false);
      return false;
    }
  }, [ensureAudio]);

  const stopMusic = useCallback((reset = false) => {
    const music = audioRef.current;

    if (!music) {
      return;
    }

    music.pause();

    if (reset) {
      music.currentTime = 0;
    }
  }, []);

  useEffect(() => {
    let storedPreference = false;

    try {
      storedPreference = window.localStorage.getItem(STORAGE_KEY) === "on";
    } catch {
      // Music still works for the current visit if storage is unavailable.
    }

    enabledRef.current = storedPreference;
    setIsEnabled(storedPreference);

    const resumeAfterInteraction = (event: MouseEvent | KeyboardEvent) => {
      if (!enabledRef.current || audioRef.current?.paused === false) {
        return;
      }

      if (event.target instanceof Element && event.target.closest("[data-music-toggle]")) {
        return;
      }

      void startMusic();
    };

    document.addEventListener("click", resumeAfterInteraction);
    document.addEventListener("keydown", resumeAfterInteraction);

    return () => {
      document.removeEventListener("click", resumeAfterInteraction);
      document.removeEventListener("keydown", resumeAfterInteraction);
      stopMusic();
    };
  }, [startMusic, stopMusic]);

  function storePreference(isOn: boolean) {
    try {
      window.localStorage.setItem(STORAGE_KEY, isOn ? "on" : "off");
    } catch {
      // The control still works for the current visit if storage is unavailable.
    }
  }

  function toggleMusic() {
    const nextValue = !enabledRef.current;
    enabledRef.current = nextValue;
    setIsEnabled(nextValue);
    storePreference(nextValue);

    if (nextValue) {
      void startMusic();
    } else {
      stopMusic(true);
    }
  }

  return (
    <>
      <button
        aria-label={isEnabled ? "Turn background music off" : "Turn background music on"}
        aria-pressed={isEnabled}
        className="border border-terminal-yellow/55 px-2 py-1 text-terminal-yellow transition hover:border-terminal-paper hover:text-terminal-paper"
        data-music-toggle
        onClick={toggleMusic}
        title={isEnabled && !isPlaying ? "Music enabled; waiting for browser playback permission" : undefined}
        type="button"
      >
        MUS {isEnabled ? "ON" : "OFF"}
      </button>
      <span aria-live="polite" className="sr-only">
        {isEnabled ? (isPlaying ? "Background music playing" : "Background music enabled and waiting to play") : "Background music off"}
      </span>
    </>
  );
}
