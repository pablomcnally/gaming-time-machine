import { useId } from 'react';

interface KnobProps {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  display?: string;
  accent?: 'amber' | 'cyan' | 'red';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  modulatedValue?: number;
  onChange: (value: number) => void;
}

export function Knob({
  label,
  value,
  min = 0,
  max = 1,
  step = 0.01,
  display,
  accent = 'amber',
  size = 'medium',
  disabled,
  modulatedValue,
  onChange,
}: KnobProps) {
  const id = useId();
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const degrees = -135 + normalized * 270;
  const ghostNormalized =
    modulatedValue === undefined
      ? normalized
      : Math.max(0, Math.min(1, (modulatedValue - min) / (max - min)));
  const ghostDegrees = -135 + ghostNormalized * 270;
  const isModulating =
    modulatedValue !== undefined && Math.abs(ghostNormalized - normalized) > 0.002;
  return (
    <label
      className={`knob knob--${size} knob--${accent} ${disabled ? 'is-disabled' : ''} ${isModulating ? 'is-modulating' : ''}`}
      htmlFor={id}
    >
      <span
        className="knob__face"
        style={
          {
            '--knob-angle': `${degrees}deg`,
            '--ghost-angle': `${ghostDegrees}deg`,
          } as React.CSSProperties
        }
      >
        <span className="knob__ghost" />
        <span className="knob__marker" />
        <span className="knob__cap" />
      </span>
      <input
        id={id}
        className="knob__input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
      <span className="knob__value">{display ?? Math.round(normalized * 100)}</span>
      <span className="knob__label">{label}</span>
    </label>
  );
}
