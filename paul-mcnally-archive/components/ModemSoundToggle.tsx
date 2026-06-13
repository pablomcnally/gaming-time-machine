"use client";

import { useEffect, useRef, useState } from "react";

type AudioNodes = {
  carrierA: OscillatorNode;
  carrierB: OscillatorNode;
  masterGain: GainNode;
  noise: AudioBufferSourceNode;
};

const MODEM_VOLUME = 0.14;

export function ModemSoundToggle() {
  const [isOn, setIsOn] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<AudioNodes | null>(null);
  const chirpTimerRef = useRef<number | null>(null);
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

  function scheduleChirp(context: AudioContext, destination: AudioNode, delay = 0) {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const start = context.currentTime + delay;
    const duration = 0.055 + Math.random() * 0.08;
    const frequency = 700 + Math.random() * 2100;

    oscillator.type = Math.random() > 0.5 ? "square" : "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * (0.65 + Math.random() * 0.7), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.085, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    oscillator.connect(gain);
    gain.connect(destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.02);
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
    const noiseGain = context.createGain();
    const carrierA = context.createOscillator();
    const carrierB = context.createOscillator();
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
    carrierBGain.gain.value = 0.035;

    noise.buffer = makeNoiseBuffer(context);
    noise.loop = true;
    noiseGain.gain.value = 0.026;

    carrierA.connect(carrierAGain);
    carrierB.connect(carrierBGain);
    noise.connect(noiseGain);
    carrierAGain.connect(bandpass);
    carrierBGain.connect(bandpass);
    noiseGain.connect(bandpass);
    bandpass.connect(masterGain);
    masterGain.connect(context.destination);

    carrierA.start();
    carrierB.start();
    noise.start();

    [0, 0.08, 0.16, 0.27].forEach((delay) => {
      scheduleChirp(context, masterGain, delay);
    });

    warbleTimerRef.current = window.setInterval(() => {
      const now = context.currentTime;
      const nextFrequency = Math.random() > 0.5 ? 1180 : 1270;
      carrierA.frequency.setTargetAtTime(nextFrequency, now, 0.015);
      carrierB.frequency.setTargetAtTime(2050 + Math.random() * 260, now, 0.02);
    }, 140);

    chirpTimerRef.current = window.setInterval(() => {
      if (Math.random() > 0.22) {
        scheduleChirp(context, masterGain);
      }
    }, 520);

    contextRef.current = context;
    nodesRef.current = { carrierA, carrierB, masterGain, noise };

    if (context.state === "suspended") {
      void context.resume().catch(() => stopSound());
    }

    return true;
  }

  function stopSound() {
    if (chirpTimerRef.current) {
      window.clearInterval(chirpTimerRef.current);
      chirpTimerRef.current = null;
    }

    if (warbleTimerRef.current) {
      window.clearInterval(warbleTimerRef.current);
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
