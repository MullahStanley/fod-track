"use client";

import type { ReactNode } from "react";

/** Horizontal macro progress bar with target line. */
export function MacroBar({
  label,
  value,
  target,
  unit = "g",
  color,
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color: string;
}) {
  const pct = target > 0 ? Math.min(100, (value / target) * 100) : 0;
  const over = value > target && target > 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-xs">
        <span className="font-medium text-slate-300">{label}</span>
        <span className={over ? "text-bad" : "text-muted"}>
          {Math.round(value)} / {Math.round(target)}
          {unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-overlay">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: over ? "#f87171" : color }}
        />
      </div>
    </div>
  );
}

/** +/- grams stepper for item quantity adjustment. */
export function GramStepper({
  grams,
  step = 10,
  min = 1,
  max = 3000,
  onChange,
}: {
  grams: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (grams: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        aria-label="Decrease grams"
        className="h-9 w-9 rounded-lg border border-line bg-surface text-lg leading-none text-slate-200 active:bg-surface-overlay"
        onClick={() => onChange(Math.max(min, grams - step))}
      >
        −
      </button>
      <input
        type="number"
        className="input h-9 w-20 !px-2 text-center text-sm"
        value={grams}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, Math.round(v))));
        }}
      />
      <span className="text-xs text-muted">g</span>
      <button
        type="button"
        aria-label="Increase grams"
        className="h-9 w-9 rounded-lg border border-line bg-surface text-lg leading-none text-slate-200 active:bg-surface-overlay"
        onClick={() => onChange(Math.min(max, grams + step))}
      >
        +
      </button>
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">{children}</h2>
      {right}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-500 border-t-transparent ${className}`}
    />
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="card text-center">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
