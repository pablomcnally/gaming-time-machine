import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outputDir = path.join(scriptDir, "..", "public", "audio");
const sampleRate = 22050;
let seed = 19790503;

fs.mkdirSync(outputDir, { recursive: true });

function random() {
  seed = (seed * 1664525 + 1013904223) >>> 0;
  return seed / 4294967296;
}

function clamp(value, min = -1, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function envelope(time, duration, attack = 0.025, release = 0.08) {
  const fadeIn = Math.min(1, time / attack);
  const fadeOut = Math.min(1, (duration - time) / release);
  return Math.max(0, Math.min(fadeIn, fadeOut));
}

function sine(time, frequency) {
  return Math.sin(2 * Math.PI * frequency * time);
}

function square(time, frequency) {
  return sine(time, frequency) >= 0 ? 1 : -1;
}

function softClip(value) {
  return Math.tanh(value * 1.8) / Math.tanh(1.8);
}

function burst(time, start, length, frequency, volume, shape = "square") {
  if (time < start || time > start + length) {
    return 0;
  }

  const localTime = time - start;
  const base =
    shape === "square"
      ? square(localTime, frequency)
      : shape === "saw"
        ? 2 * ((localTime * frequency) % 1) - 1
        : sine(localTime, frequency);

  return base * envelope(localTime, length, 0.004, 0.018) * volume;
}

function fskData(time, start, length, lowFrequency, highFrequency, bitRate, volume) {
  if (time < start || time > start + length) {
    return 0;
  }

  const localTime = time - start;
  const bitIndex = Math.floor(localTime * bitRate);
  const bit = (bitIndex * 13 + Math.floor(bitIndex / 3) * 7) % 11;
  const frequency = bit < 5 ? lowFrequency : highFrequency;
  const roughness = square(localTime, frequency * 0.5) * 0.2;
  const noise = (random() * 2 - 1) * 0.22;

  return (sine(localTime, frequency) + square(localTime, frequency * 1.01) * 0.42 + roughness + noise) * envelope(localTime, length, 0.025, 0.08) * volume;
}

function writeWav(filePath, samples) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * bytesPerSample, 28);
  buffer.writeUInt16LE(bytesPerSample, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let index = 0; index < samples.length; index += 1) {
    buffer.writeInt16LE(Math.round(clamp(samples[index]) * 32767), 44 + index * 2);
  }

  fs.writeFileSync(filePath, buffer);
}

function generateHandshake() {
  const duration = 4.15;
  const samples = new Float32Array(Math.floor(duration * sampleRate));

  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate;
    let sample = 0;

    sample += burst(time, 0.04, 0.48, 2100, 0.2, "sine");
    sample += burst(time, 0.58, 0.12, 980, 0.26, "square");
    sample += burst(time, 0.74, 0.1, 1180, 0.22, "square");
    sample += burst(time, 0.9, 0.14, 1650, 0.24, "saw");
    sample += burst(time, 1.12, 0.1, 2400, 0.22, "square");
    sample += fskData(time, 1.28, 0.72, 1070, 1270, 62, 0.23);
    sample += burst(time, 2.08, 0.11, 1750, 0.24, "square");
    sample += burst(time, 2.25, 0.09, 2250, 0.2, "saw");
    sample += fskData(time, 2.42, 1.08, 980, 2225, 86, 0.22);
    sample += burst(time, 3.66, 0.13, 1300, 0.18, "square");
    sample += burst(time, 3.83, 0.12, 1850, 0.16, "saw");

    const lineNoise = (random() * 2 - 1) * 0.018;
    samples[index] = clamp(softClip(sample + lineNoise) * 0.82);
  }

  return samples;
}

writeWav(path.join(outputDir, "modem-handshake.wav"), generateHandshake());

const oldLoopPath = path.join(outputDir, "modem-carrier-loop.wav");
if (fs.existsSync(oldLoopPath)) {
  fs.unlinkSync(oldLoopPath);
}

console.log(`Generated one-shot modem handshake in ${outputDir}`);
