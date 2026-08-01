export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));

export const lerp = (a: number, b: number, amount: number): number =>
  a + (b - a) * clamp(amount, 0, 1);

export const dbToGain = (db: number): number => Math.pow(10, db / 20);

export const midiToHz = (note: number): number => 440 * Math.pow(2, (note - 69) / 12);

export const centsToRatio = (cents: number): number => Math.pow(2, cents / 1200);

export const safeParam = (
  param: AudioParam,
  value: number,
  now: number,
  smoothing = 0.08,
): void => {
  const safe = Number.isFinite(value) ? value : 0;
  param.cancelScheduledValues(now);
  param.setTargetAtTime(safe, now, Math.max(0.005, smoothing));
};
