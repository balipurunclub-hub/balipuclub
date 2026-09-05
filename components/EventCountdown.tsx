'use client';

import { useEffect, useState } from 'react';

/** Event start: 11 Oct 2026, 6:30 AM IST */
export const ALOYSIUS_EVENT_AT = new Date('2026-10-11T06:30:00+05:30').getTime();

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  done: boolean;
};

function calcLeft(now: number): TimeLeft {
  const diff = Math.max(0, ALOYSIUS_EVENT_AT - now);
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, done: false };
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

type EventCountdownProps = {
  className?: string;
  compact?: boolean;
};

export function EventCountdown({ className = '', compact = false }: EventCountdownProps) {
  const [left, setLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setLeft(calcLeft(Date.now()));
    const id = setInterval(() => setLeft(calcLeft(Date.now())), 1000);
    return () => clearInterval(id);
  }, []);

  if (!left) {
    return (
      <div className={`flex gap-2 ${className}`} aria-hidden>
        {['Days', 'Hrs', 'Min', 'Sec'].map((label) => (
          <div
            key={label}
            className="min-w-[3.25rem] rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center"
          >
            <div className="font-heading text-sm text-white/30">--</div>
            <div className="text-[9px] uppercase tracking-wider text-white/30">{label}</div>
          </div>
        ))}
      </div>
    );
  }

  if (left.done) {
    return (
      <p className={`text-[#FF2D87] text-sm font-semibold tracking-wide ${className}`}>
        Event day is here
      </p>
    );
  }

  const units = [
    { label: 'Days', value: left.days },
    { label: 'Hrs', value: left.hours },
    { label: 'Min', value: left.minutes },
    { label: 'Sec', value: left.seconds },
  ];

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-1.5 sm:gap-2 ${className}`}
      role="timer"
      aria-live="polite"
      aria-label={`Countdown: ${left.days} days, ${left.hours} hours, ${left.minutes} minutes, ${left.seconds} seconds`}
    >
      {units.map((u) => (
        <div
          key={u.label}
          className={`rounded-lg border border-[#FF2D87]/30 bg-[#FF2D87]/10 text-center ${
            compact ? 'min-w-[2.75rem] px-1.5 py-1' : 'min-w-[3.25rem] sm:min-w-[3.5rem] px-2 py-1.5'
          }`}
        >
          <div
            className={`font-heading text-[#FF2D87] tabular-nums leading-none ${
              compact ? 'text-sm' : 'text-base sm:text-lg'
            }`}
          >
            {pad(u.value)}
          </div>
          <div className="text-[8px] sm:text-[9px] uppercase tracking-wider text-white/45 mt-0.5">
            {u.label}
          </div>
        </div>
      ))}
    </div>
  );
}
