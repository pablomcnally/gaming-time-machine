import { useEffect, useRef } from 'react';
import type { DriftEngine } from '../audio/DriftEngine';

interface VisualizerProps {
  engine: DriftEngine | null;
  evolution: number;
  frozen: boolean;
  quality: 'low' | 'medium' | 'high';
}

export function Visualizer({ engine, evolution, frozen, quality }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) return;
    let animation = 0;
    let lastDraw = 0;
    const maxFps = quality === 'low' ? 12 : quality === 'medium' ? 24 : 40;

    const draw = (time: number) => {
      animation = requestAnimationFrame(draw);
      if (time - lastDraw < 1000 / maxFps) return;
      lastDraw = time;
      const ratio = Math.min(window.devicePixelRatio || 1, quality === 'high' ? 2 : 1.25);
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.fillStyle = '#080b0a';
      context.fillRect(0, 0, width, height);
      context.strokeStyle = 'rgba(113, 137, 128, 0.12)';
      context.lineWidth = 1;
      for (let column = 1; column < 8; column += 1) {
        const x = (column / 8) * width;
        context.beginPath();
        context.moveTo(x, 0);
        context.lineTo(x, height);
        context.stroke();
      }
      for (let row = 1; row < 4; row += 1) {
        const y = (row / 4) * height;
        context.beginPath();
        context.moveTo(0, y);
        context.lineTo(width, y);
        context.stroke();
      }

      const frame = engine?.getMeterFrame();
      const waveform = frame?.waveform;
      if (waveform) {
        const glow = context.createLinearGradient(0, 0, width, 0);
        glow.addColorStop(0, 'rgba(93, 179, 173, .28)');
        glow.addColorStop(0.5, frozen ? 'rgba(201,169,110,.7)' : 'rgba(109,206,193,.9)');
        glow.addColorStop(1, 'rgba(201,169,110,.28)');
        context.strokeStyle = glow;
        context.lineWidth = ratio * 1.4;
        context.beginPath();
        waveform.forEach((value, index) => {
          const x = (index / (waveform.length - 1)) * width;
          const amplitude = (value - 128) / 128;
          const y = height * 0.5 + amplitude * height * (0.3 + evolution * 0.1);
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        });
        context.stroke();

        const spectrum = frame.spectrum;
        context.fillStyle = 'rgba(201, 169, 110, .14)';
        const bars = quality === 'low' ? 24 : 48;
        for (let index = 0; index < bars; index += 1) {
          const spectrumIndex = Math.floor(Math.pow(index / bars, 1.7) * spectrum.length * 0.45);
          const level = spectrum[spectrumIndex]! / 255;
          const barWidth = width / bars;
          context.fillRect(index * barWidth, height - level * height * 0.48, barWidth - 1, level * height * 0.48);
        }
      } else {
        context.strokeStyle = 'rgba(201, 169, 110, .28)';
        context.lineWidth = ratio;
        context.beginPath();
        const phase = time * 0.00015;
        for (let index = 0; index <= 160; index += 1) {
          const x = (index / 160) * width;
          const y =
            height / 2 +
            Math.sin(index * 0.12 + phase) * height * 0.04 +
            Math.sin(index * 0.031 - phase * 0.6) * height * 0.08;
          if (index === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
    };
    animation = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animation);
  }, [engine, evolution, frozen, quality]);

  return (
    <div className="visualizer">
      <canvas ref={canvasRef} aria-label="Live waveform and harmonic energy display" />
      <div className="visualizer__labels">
        <span>HARMONIC FIELD</span>
        <span>{frozen ? 'HOLD' : 'EVOLVING'}</span>
      </div>
    </div>
  );
}
