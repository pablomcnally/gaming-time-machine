"use client";

import { useEffect, useRef, useState } from "react";

const HANDSHAKE_SRC = "/audio/modem-handshake.wav";
const HANDSHAKE_VOLUME = 0.58;

export function ModemSoundToggle() {
  const [isOn, setIsOn] = useState(false);
  const handshakeRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => stopSound();
  }, []);

  function ensureAudio() {
    if (!handshakeRef.current) {
      const handshake = new Audio(HANDSHAKE_SRC);
      handshake.preload = "auto";
      handshake.volume = HANDSHAKE_VOLUME;
      handshake.addEventListener("ended", () => setIsOn(false));
      handshakeRef.current = handshake;
    }

    return handshakeRef.current;
  }

  function startSound() {
    const handshake = ensureAudio();

    handshake.pause();
    handshake.currentTime = 0;
    handshake.volume = HANDSHAKE_VOLUME;

    void handshake.play().catch(() => undefined);

    return true;
  }

  function stopSound() {
    const handshake = handshakeRef.current;

    if (!handshake) {
      return;
    }

    handshake.pause();
    handshake.currentTime = 0;
    handshake.volume = HANDSHAKE_VOLUME;
  }

  function toggleSound() {
    if (isOn) {
      stopSound();
      setIsOn(false);
      return;
    }

    setIsOn(startSound());
  }

  return (
    <button
      aria-label={isOn ? "Turn modem sound off" : "Turn modem sound on"}
      aria-pressed={isOn}
      className="border border-terminal-green/55 px-2 py-1 text-terminal-green transition hover:border-terminal-yellow hover:text-terminal-yellow"
      onClick={toggleSound}
      type="button"
    >
      SND {isOn ? "ON" : "OFF"}
    </button>
  );
}
