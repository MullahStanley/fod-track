"use client";

import { useState, type ReactNode } from "react";

/** Horizontal macro progress bar with glowing track and percentage badge. */
export function MacroBar({
  label,
  value,
  target,
  unit = "g",
  color,
  glowColor,
}: {
  label: string;
  value: number;
  target: number;
  unit?: string;
  color: string;
  glowColor?: string;
}) {
  const pct = target > 0 ? Math.min(100, Math.round((value / target) * 100)) : 0;
  const over = value > target && target > 0;
  const remaining = Math.max(0, target - value);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: over ? "#f87171" : color, boxShadow: `0 0 8px ${glowColor || color}` }}
          />
          <span className="font-semibold text-ink">{label}</span>
          <span className="text-[10px] text-muted">({pct}%)</span>
        </div>
        <div className="flex items-baseline gap-1 font-mono text-[11px]">
          <span className={`font-bold ${over ? "text-bad" : "text-ink"}`}>
            {Math.round(value)}
          </span>
          <span className="text-muted">/ {Math.round(target)}{unit}</span>
          {!over && target > 0 && (
            <span className="ml-1 text-[10px] text-muted hidden sm:inline">
              ({Math.round(remaining)}{unit} left)
            </span>
          )}
        </div>
      </div>

      <div className="h-2.5 overflow-hidden rounded-full bg-surface-overlay/80 border border-white/5 p-0.5">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: over
              ? "linear-gradient(90deg, #f87171, #ef4444)"
              : `linear-gradient(90deg, ${color}, ${glowColor || color})`,
            boxShadow: over ? "0 0 10px rgba(239, 68, 68, 0.5)" : `0 0 8px ${glowColor || color}40`,
          }}
        />
      </div>
    </div>
  );
}

/** Circular Calorie Progress Ring with gradient glow. */
export function CalorieProgressRing({
  current,
  target,
  size = 140,
  strokeWidth = 10,
}: {
  current: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  const strokeDashoffset = circumference - (pct / 100) * circumference;
  const remaining = target - current;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-white/10"
        />

        {/* Gradient definition */}
        <defs>
          <linearGradient id="calRingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="50%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>

        {/* Foreground animated progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#calRingGrad)"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
          style={{ filter: "drop-shadow(0 0 6px rgba(16, 185, 129, 0.45))" }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
          Consumed
        </span>
        <span className="font-mono text-2xl font-extrabold text-ink leading-tight">
          {current}
        </span>
        <span className="text-[11px] text-muted">
          {remaining >= 0 ? `${remaining} left` : `${Math.abs(remaining)} over`}
        </span>
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
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-base font-bold text-ink transition active:scale-95 hover:border-emerald-400/40"
        onClick={() => onChange(Math.max(min, grams - step))}
      >
        −
      </button>
      <input
        type="number"
        className="input h-9 w-20 !px-2 text-center text-sm font-mono font-medium"
        value={grams}
        min={min}
        max={max}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, Math.round(v))));
        }}
      />
      <span className="text-xs font-medium text-muted">g</span>
      <button
        type="button"
        aria-label="Increase grams"
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-base font-bold text-ink transition active:scale-95 hover:border-emerald-400/40"
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
      <h2 className="text-xs font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
        {children}
      </h2>
      {right}
    </div>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent ${className}`}
    />
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="card text-center py-8">
      <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-xl">
        🍽️
      </div>
      <p className="text-sm font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1 text-xs text-muted max-w-sm mx-auto">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Interactive Daily Water Tracker with progress and quick log. */
export function WaterTracker({
  intakeMl,
  targetMl = 2500,
  onUpdate,
}: {
  intakeMl: number;
  targetMl?: number;
  onUpdate: (newAmount: number) => void;
}) {
  const pct = Math.min(100, Math.round((intakeMl / targetMl) * 100));

  return (
    <div className="card bg-surface-raised/80 border-cyan-500/20 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-300 text-base">
            💧
          </span>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Daily Water Hydration
            </h3>
            <p className="font-mono text-sm font-bold text-cyan-400">
              {intakeMl} <span className="text-xs font-normal text-muted">/ {targetMl} ml</span>
            </p>
          </div>
        </div>
        <span className="chip !text-[11px] !border-cyan-500/30 !text-cyan-300">
          {pct}%
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-cyan-950/40 border border-cyan-500/20">
        <div
          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
          style={{ width: `${pct}%`, boxShadow: "0 0 8px rgba(6, 182, 212, 0.4)" }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => onUpdate(Math.max(0, intakeMl - 250))}
          className="chip !px-2.5 !text-[11px] hover:border-red-400"
          title="Minus 250ml"
        >
          − 250ml
        </button>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => onUpdate(intakeMl + 250)}
            className="chip !px-2.5 !text-[11px] !border-cyan-500/40 !bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
          >
            + 250ml (glass)
          </button>
          <button
            type="button"
            onClick={() => onUpdate(intakeMl + 500)}
            className="chip !px-2.5 !text-[11px] !border-cyan-500/40 !bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20"
          >
            + 500ml (bottle)
          </button>
        </div>
      </div>
    </div>
  );
}
