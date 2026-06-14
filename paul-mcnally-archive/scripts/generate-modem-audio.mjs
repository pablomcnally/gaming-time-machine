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

function tone(time, frequency, wobble = 0, wobbleRate = 0) {
  const modulated = frequency + Math.sin(2 * Math.PI * wobbleRate * time) * wobble;
  return Math.sin(2 * Math.PI * modulated * time);
}

function burst(time, start, length, frequency, volume, shape = "sine") {
  if (time < start || time > start + length) {
    return 0;
  }

  const localTime = time - start;
  const sweep = frequency * (1 + (0.4 * localTime) / length);
  const base =
    shape === "square"
      ? Math.sign(tone(localTime, sweep))
      : shape === "saw"
        ? 2 * ((localTime * sweep) % 1) - 1
        : tone(localTime, sweep, 35, 7);

  return base * envelope(localTime, length, 0.008, 0.035) * volume;
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
  const duration = 3.25;
  const samples = new Float32Array(Math.floor(duration * sampleRate));

  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate;
    let sample = 0;

    sample += (tone(time, 2100, 7, 3) + tone(time, 2225, 5, 2.5)) * 0.16 * envelope(time, 0.62, 0.03, 0.12);
    sample += burst(time, 0.72, 0.16, 980, 0.26, "square");
    sample += burst(time, 0.93, 0.22, 1650, 0.24, "saw");
    sample += burst(time, 1.23, 0.12, 2420, 0.24, "square");
    sample += burst(time, 1.42, 0.34, 1280, 0.2, "sine");
    sample += burst(time, 1.86, 0.18, 1850, 0.2, "saw");
    sample += burst(time, 2.14, 0.44, 740, 0.18, "square");

    const dataEnvelope = time > 1.05 ? envelope(time - 1.05, duration - 1.05, 0.06, 0.34) : 0;
    const bitRate = 32 + (Math.floor(time * 17) % 13);
    const bit = Math.sin(2 * Math.PI * bitRate * time) > 0 ? 1 : -1;
    const carrier = tone(time, 1180 + bit * 115, 18, 11) + tone(time, 2230 - bit * 170, 28, 7) * 0.65;
    const noise = (random() * 2 - 1) * 0.18;

    sample += (carrier * 0.13 + noise) * dataEnvelope;
    samples[index] = clamp(sample * 0.86);
  }

  return samples;
}

function generateCarrierLoop() {
  const duration = 5.2;
  const samples = new Float32Array(Math.floor(duration * sampleRate));

  for (let index = 0; index < samples.length; index += 1) {
    const time = index / sampleRate;
    const loopEnvelope = Math.min(1, time / 0.08, (duration - time) / 0.08);
    const frame = Math.floor(time * 46);
    const bitA = frame % 5 < 2 ? 1 : -1;
    const bitB = frame % 7 < 3 ? -1 : 1;
    let sample = 0;

    sample += tone(time, 1170 + bitA * 130, 22, 10) * 0.22;
    sample += tone(time, 2200 + bitB * 180, 34, 8) * 0.16;
    sample += tone(time, 640 + bitA * bitB * 45, 12, 5) * 0.08;
    sample += (random() * 2 - 1) * 0.08;
    sample += Math.sin(2 * Math.PI * 91 * time) * Math.sin(2 * Math.PI * 7.5 * time) * 0.035;
    samples[index] = clamp(sample * loopEnvelope * 0.72);
  }

  return samples;
}

writeWav(path.join(outputDir, "modem-handshake.wav"), generateHandshake());
writeWav(path.join(outputDir, "modem-carrier-loop.wav"), generateCarrierLoop());

console.log(`Generated modem audio in ${outputDir}`);
