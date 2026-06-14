"use client";

import { useEffect, useRef, useState } from "react";

const HANDSHAKE_SRC = "/audio/modem-handshake.wav";
const CARRIER_SRC = "/audio/modem-carrier-loop.wav";
const HANDSHAKE_VOLUME = 0.55;
const CARRIER_VOLUME = 0.26;

export function ModemSoundToggle() {
  const [isOn, setIsOn] = useState(false);
  const handshakeRef = useRef<HTMLAudioElement | null>(null);
  const carrierRef = useRef<HTMLAudioElement | null>(null);
  const carrierTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => stopSound();
  }, []);

  function ensureAudio() {
    if (!handshakeRef.current) {
      const handshake = new Audio(HANDSHAKE_SRC);
      handshake.preload = "auto";
      handshake.volume = HANDSHAKE_VOLUME;
      handshakeRef.current = handshake;
    }

    if (!carrierRef.current) {
      const carrier = new Audio(CARRIER_SRC);
      carrier.loop = true;
      carrier.preload = "auto";
      carrier.volume = 0;
      carrierRef.current = carrier;
    }

    return {
      carrier: carrierRef.current,
      handshake: handshakeRef.current
    };
  }

  function startSound() {
    const { carrier, handshake } = ensureAudio();

    if (carrierTimerRef.current) {
      window.clearTimeout(carrierTimerRef.current);
    }

    handshake.pause();
    carrier.pause();
    handshake.currentTime = 0;
    carrier.currentTime = 0;
    handshake.volume = HANDSHAKE_VOLUME;
    carrier.volume = 0;

    void handshake.play().catch(() => undefined);
    void carrier.play().catch(() => undefined);

    carrierTimerRef.current = window.setTimeout(() => {
      carrier.volume = CARRIER_VOLUME;
      carrierTimerRef.current = null;
    }, 900);

    return true;
  }

  function stopSound() {
    if (carrierTimerRef.current) {
      window.clearTimeout(carrierTimerRef.current);
      carrierTimerRef.current = null;
    }

    [handshakeRef.current, carrierRef.current].forEach((audio) => {
      if (!audio) {
        return;
      }

      audio.pause();
      audio.currentTime = 0;
      audio.volume = audio === carrierRef.current ? 0 : HANDSHAKE_VOLUME;
    });
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
