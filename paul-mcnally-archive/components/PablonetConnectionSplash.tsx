"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  getOrCreatePrestelServer,
  PRESTEL_CONNECTION_STORAGE_KEY,
  type PrestelServerName
} from "../lib/prestelServers";

const logoRows = ["P", "PA", "PAB", "PABLO", "PABLONET", "BLONET", "ONET", "ET", "T"];
const totalLogoCharacters = logoRows.reduce((total, row) => total + row.length, 0);
const characterColours: Record<string, string> = {
  P: "green",
  A: "red",
  B: "cyan",
  L: "yellow",
  O: "white",
  N: "magenta",
  E: "cyan",
  T: "white"
};

type ConnectionPhase = "checking" | "ready" | "connecting" | "connected" | "done";

export function PablonetConnectionSplash() {
  const [phase, setPhase] = useState<ConnectionPhase>("checking");
  const [serverName, setServerName] = useState<PrestelServerName | null>(null);
  const [revealedCharacters, setRevealedCharacters] = useState(0);
  const [logoComplete, setLogoComplete] = useState(false);
  const [audioComplete, setAudioComplete] = useState(false);
  const connectButtonRef = useRef<HTMLButtonElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const audioFallbackTimerRef = useRef<number | null>(null);
  const exitTimerRef = useRef<number | null>(null);

  function clearTimers() {
    if (revealTimerRef.current !== null) window.clearInterval(revealTimerRef.current);
    if (audioFallbackTimerRef.current !== null) window.clearTimeout(audioFallbackTimerRef.current);
    if (exitTimerRef.current !== null) window.clearTimeout(exitTimerRef.current);
  }

  function finishSession() {
    clearTimers();
    audioRef.current?.pause();
    window.sessionStorage.setItem(PRESTEL_CONNECTION_STORAGE_KEY, "true");
    document.documentElement.classList.add("pablonet-connected");
    setPhase("done");
  }

  useEffect(() => {
    if (window.sessionStorage.getItem(PRESTEL_CONNECTION_STORAGE_KEY) === "true") {
      document.documentElement.classList.add("pablonet-connected");
      setPhase("done");
      return;
    }

    setServerName(getOrCreatePrestelServer(window.sessionStorage));
    setPhase("ready");

    return () => {
      clearTimers();
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    if (phase !== "connecting" || !logoComplete || !audioComplete) return;

    setPhase("connected");
    exitTimerRef.current = window.setTimeout(finishSession, 1600);
  }, [audioComplete, logoComplete, phase]);

  useEffect(() => {
    if (phase === "ready") connectButtonRef.current?.focus();
  }, [phase]);

  function connect() {
    if (phase !== "ready") return;

    setPhase("connecting");
    setRevealedCharacters(0);
    setLogoComplete(false);
    setAudioComplete(false);

    const audio = new Audio("/media/pablonet-modem.mp3");
    audio.preload = "auto";
    audio.volume = 0.78;
    audioRef.current = audio;
    audio.addEventListener(
      "ended",
      () => {
        if (audioFallbackTimerRef.current !== null) {
          window.clearTimeout(audioFallbackTimerRef.current);
          audioFallbackTimerRef.current = null;
        }
        setAudioComplete(true);
      },
      { once: true }
    );
    audio.play().catch(() => setAudioComplete(true));
    audioFallbackTimerRef.current = window.setTimeout(() => setAudioComplete(true), 10000);

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setRevealedCharacters(totalLogoCharacters);
      setLogoComplete(true);
      return;
    }

    let nextCharacter = 0;
    revealTimerRef.current = window.setInterval(() => {
      nextCharacter += 1;
      setRevealedCharacters(nextCharacter);

      if (nextCharacter >= totalLogoCharacters) {
        if (revealTimerRef.current !== null) window.clearInterval(revealTimerRef.current);
        revealTimerRef.current = null;
        setLogoComplete(true);
      }
    }, 95);
  }

  if (phase === "done" || typeof document === "undefined") return null;

  let characterOffset = 0;

  return createPortal(
    <section
      className="pablonet-connection-splash"
      role="dialog"
      aria-modal="true"
      aria-label="Pablonet dial-up connection"
    >
      <div className="pablonet-connection-terminal">
        <p className="pablonet-connection-kicker">Pablonet 800 dial-up service</p>

        {phase === "ready" || phase === "checking" ? (
          <div className="pablonet-connect-prompt">
            <p>{phase === "checking" ? "Checking line..." : "Modem ready // Press connect"}</p>
            <button ref={connectButtonRef} type="button" onClick={connect} disabled={phase === "checking"}>
              Connect
            </button>
          </div>
        ) : (
          <div className="pablonet-logo-frame" aria-label="Pablonet">
            <div className="pablonet-logo-diamond" aria-hidden="true" />
            <div className="pablonet-logo-rows" aria-hidden="true">
              {logoRows.map((row, rowIndex) => {
                const rowStart = characterOffset;
                characterOffset += row.length;

                return (
                  <div className="pablonet-logo-row" key={`${row}-${rowIndex}`}>
                    {[...row].map((character, characterIndex) => (
                      <span
                        className="pablonet-logo-character"
                        data-colour={characterColours[character]}
                        data-visible={revealedCharacters > rowStart + characterIndex}
                        key={`${character}-${characterIndex}`}
                      >
                        {character}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="pablonet-connection-status" role="status" aria-live="polite">
          {phase === "connecting" ? <p>Receiving service ident...</p> : null}
          {phase === "connected" ? (
            <>
              <p>Connection established</p>
              <strong>You are logged in to: {serverName}</strong>
            </>
          ) : null}
        </div>

        {phase !== "checking" ? (
          <button type="button" className="pablonet-connection-skip" onClick={finishSession}>
            Skip
          </button>
        ) : null}
      </div>
    </section>,
    document.body
  );
}
