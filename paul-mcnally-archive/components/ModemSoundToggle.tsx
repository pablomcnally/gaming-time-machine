"use client";

import { useEffect, useRef, useState } from "react";

type AudioNodes = {
  carrierA: OscillatorNode;
  carrierB: OscillatorNode;
  carrierC: OscillatorNode;
  masterGain: GainNode;
  noise: AudioBufferSourceNode;
};

const MODEM_VOLUME = 0.12;

export function ModemSoundToggle() {
  const [isOn, setIsOn] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNodes | null>(null);
  const warbleTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => stopSound();
  }, []);

  function makeNoiseBuffer(context: AudioContext) {
    const buffer = context.createBuffer(1, context.sampleRate * 2, context.sampleRate);
    const data = buffer.getChannelData(0);

    for (let index = 0; index < data.length; index += 1) {
      data[index] = (Math.random() * 2 - 1) * 0.35;
    }

    return buffer;
  }

  function scheduleHandshakeTone(
    context: AudioContext,
    destination: AudioNode,
    delay: number,
    frequency: number,
    duration: number,
    volume: number,
    type: OscillatorType = "sine"
  ) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.04, start + duration * 0.45);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
  }

  function scheduleHandshake(context: AudioContext, destination: AudioNode) {
    [
      [0, 2100, 0.24, 0.11, "sine"],
      [0.3, 980, 0.1, 0.075, "square"],
      [0.43, 1650, 0.13, 0.08, "sawtooth"],
      [0.62, 2420, 0.08, 0.075, "square"],
      [0.75, 1220, 0.12, 0.07, "sine"],
      [0.92, 1850, 0.16, 0.065, "sawtooth"]
    ].forEach(([delay, frequency, duration, volume, type]) => {
      scheduleHandshakeTone(context, destination, Number(delay), Number(frequency), Number(duration), Number(volume), type as OscillatorType);
    });
  }

  function scheduleWarble(context: AudioContext, carrierA: OscillatorNode, carrierB: OscillatorNode, carrierC: OscillatorNode) {
    const now = context.currentTime;
    const nextA = 1120 + Math.random() * 420;
    const nextB = 1950 + Math.random() * 760;
    const nextC = 520 + Math.random() * 210;

    carrierA.frequency.setTargetAtTime(nextA, now, 0.018 + Math.random() * 0.02);
    carrierB.frequency.setTargetAtTime(nextB, now, 0.014 + Math.random() * 0.018);
    carrierC.frequency.setTargetAtTime(nextC, now, 0.03 + Math.random() * 0.04);

    warbleTimerRef.current = window.setTimeout(() => {
      if (nodesRef.current) {
        scheduleWarble(context, carrierA, carrierB, carrierC);
      }
    }, 45 + Math.random() * 115);
  }

  function startSound() {
    if (nodesRef.current) {
      return true;
    }

    const audioWindow = window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext };
    const AudioCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext;

    if (!AudioCtor) {
      return false;
    }

    const context = new AudioCtor();
    const masterGain = context.createGain();
    const bandpass = context.createBiquadFilter();
    const carrierAGain = context.createGain();
    const carrierBGain = context.createGain();
    const carrierCGain = context.createGain();
    const noiseGain = context.createGain();
    const carrierA = context.createOscillator();
    const carrierB = context.createOscillator();
    const carrierC = context.createOscillator();
    const noise = context.createBufferSource();

    masterGain.gain.setValueAtTime(0.0001, context.currentTime);
    masterGain.gain.exponentialRampToValueAtTime(MODEM_VOLUME, context.currentTime + 0.08);
    bandpass.type = "bandpass";
    bandpass.frequency.value = 1650;
    bandpass.Q.value = 3.2;

    carrierA.type = "sawtooth";
    carrierA.frequency.value = 1180;
    carrierAGain.gain.value = 0.08;
    carrierB.type = "square";
    carrierB.frequency.value = 2225;
    carrierBGain.gain.value = 0.028;
    carrierC.type = "triangle";
    carrierC.frequency.value = 620;
    carrierCGain.gain.value = 0.018;

    noise.buffer = makeNoiseBuffer(context);
    noise.loop = true;
    noiseGain.gain.value = 0.04;

    carrierA.connect(carrierAGain);
    carrierB.connect(carrierBGain);
    carrierC.connect(carrierCGain);
    noise.connect(noiseGain);
    carrierAGain.connect(bandpass);
    carrierBGain.connect(bandpass);
    carrierCGain.connect(bandpass);
    noiseGain.connect(bandpass);
    bandpass.connect(masterGain);
    masterGain.connect(context.destination);

    carrierA.start();
    carrierB.start();
    carrierC.start();
    noise.start();

    scheduleHandshake(context, masterGain);

    contextRef.current = context;
    nodesRef.current = { carrierA, carrierB, carrierC, masterGain, noise };
    scheduleWarble(context, carrierA, carrierB, carrierC);

    if (context.state === "suspended") {
      void context.resume().catch(() => stopSound());
    }

    return true;
  }

  function stopSound() {
    if (warbleTimerRef.current) {
      window.clearTimeout(warbleTimerRef.current);
      warbleTimerRef.current = null;
    }

    const nodes = nodesRef.current;
    const context = contextRef.current;

    if (nodes && context) {
      const stopAt = context.currentTime + 0.05;
      nodes.masterGain.gain.setTargetAtTime(0.0001, context.currentTime, 0.02);
      window.setTimeout(() => {
        nodes.carrierA.stop();
        nodes.carrierB.stop();
        nodes.carrierC.stop();
        nodes.noise.stop();
        context.close();
      }, stopAt * 1000 - context.currentTime * 1000);
    }

    nodesRef.current = null;
    contextRef.current = null;
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
