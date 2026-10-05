"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "pablonet-welcome-tour-v1";
const steps = [
  { selector: "[data-music-toggle]", title: "Add a little atmosphere", copy: "Use MUSIC ON / OFF for the retro soundtrack. Sound starts only when you choose to turn it on." },
  { selector: "[data-crt-toggle]", title: "Choose your screen", copy: "Use CRT ON / OFF to show or hide the television frame and screen effects. Choose whichever feels comfortable to read." },
  { selector: "[data-pro-switch]", title: "Same archive, another look", copy: "Select PRO for a clean, modern presentation of the same articles. You can switch between Pro and Pablonet anytime." }
];

export function PablonetTour() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  function finish() {
    try { localStorage.setItem(STORAGE_KEY, "done"); } catch { /* Tour works without storage. */ }
    dialog.current?.close();
    setStep(null);
    previousFocus.current?.focus();
  }

  useEffect(() => {
    if (pathname.startsWith("/editor")) return;
    let seen = false;
    try { seen = localStorage.getItem(STORAGE_KEY) === "done"; } catch { /* Use this visit only. */ }
    function start() {
      previousFocus.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setStep(0);
    }
    window.addEventListener("pablonet-tour-start", start);
    // Let the home page connection animation finish before introducing the controls.
    const timer = seen ? undefined : window.setInterval(() => {
      if (pathname !== "/" || document.documentElement.classList.contains("pablonet-connected")) {
        window.clearInterval(timer);
        start();
      }
    }, 400);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("pablonet-tour-start", start);
      dialog.current?.close();
    };
  }, [pathname]);

  useEffect(() => {
    if (step === null) return;
    const modal = dialog.current;
    if (!modal) return;
    if (!modal.open) modal.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function position() {
      const target = document.querySelector(steps[step!].selector);
      const bounds = target?.getBoundingClientRect();
      setRect(bounds ? { top: bounds.top, left: bounds.left, width: bounds.width, height: bounds.height } : null);
    }
    position();
    modal.querySelector<HTMLButtonElement>("[data-tour-next]")?.focus();
    window.addEventListener("resize", position);
    window.addEventListener("scroll", position, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("resize", position);
      window.removeEventListener("scroll", position, true);
    };
  }, [step]);

  if (pathname.startsWith("/editor")) return null;
  return <dialog ref={dialog} className="pablonet-tour" aria-labelledby="pablonet-tour-title" aria-describedby="pablonet-tour-copy" onCancel={(event) => { event.preventDefault(); finish(); }}>
    {step !== null ? <>
      {rect ? <div aria-hidden="true" className="pablonet-tour-highlight" style={{ top: rect.top - 5, left: rect.left - 5, width: rect.width + 10, height: rect.height + 10 }} /> : null}
      <section className="pablonet-tour-card">
        <p className="pablonet-tour-eyebrow">Welcome to Pablonet · {step + 1} / {steps.length}</p>
        <h2 id="pablonet-tour-title">{steps[step].title}</h2>
        <p id="pablonet-tour-copy">{steps[step].copy}</p>
        <div className="pablonet-tour-actions">
          <button type="button" onClick={finish}>Skip tour</button>
          {step > 0 ? <button type="button" onClick={() => setStep(step - 1)}>Back</button> : null}
          <button data-tour-next type="button" onClick={() => step === steps.length - 1 ? finish() : setStep(step + 1)}>{step === steps.length - 1 ? "Start browsing" : "Next"}</button>
        </div>
      </section>
    </> : null}
  </dialog>;
}
