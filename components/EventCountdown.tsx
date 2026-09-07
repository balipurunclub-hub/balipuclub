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
  /** Large digits for homepage race spotlight */
  size?: 'sm' | 'md' | 'lg';
};

const PLACEHOLDER: TimeLeft = {
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
  done: false,
};

export function EventCountdown({
  className = '',
  compact = false,
  size,
}: EventCountdownProps) {
  const [left, setLeft] = useState<TimeLeft | null>(null);
  const resolvedSize = size ?? (compact ? 'sm' : 'md');

  useEffect(() => {
    setLeft(calcLeft(Date.now()));
    const id = setInterval(() => setLeft(calcLeft(Date.now())), 1000);
    return () => clearInterval(id);
  }, []);

  const display = left ?? PLACEHOLDER;

  if (display.done) {
    return (
      <p
        className={`text-[#FF2D87] font-semibold tracking-wide ${
          resolvedSize === 'lg' ? 'text-lg sm:text-xl' : 'text-sm'
        } ${className}`}
      >
        Event day is here
      </p>
    );
  }

  const units = [
    { label: 'Days', value: display.days },
    { label: 'Hrs', value: display.hours },
    { label: 'Min', value: display.minutes },
    { label: 'Sec', value: display.seconds },
  ];

  const box =
    resolvedSize === 'lg'
      ? 'min-w-[4.25rem] sm:min-w-[5.25rem] md:min-w-[5.75rem] px-2.5 sm:px-3 py-2.5 sm:py-3 rounded-xl'
      : resolvedSize === 'sm'
        ? 'min-w-[2.75rem] px-1.5 py-1 rounded-lg'
        : 'min-w-[3.25rem] sm:min-w-[3.5rem] px-2 py-1.5 rounded-lg';

  const num =
    resolvedSize === 'lg'
      ? 'text-2xl sm:text-4xl md:text-5xl'
      : resolvedSize === 'sm'
        ? 'text-sm'
        : 'text-base sm:text-lg';

  const label =
    resolvedSize === 'lg'
      ? 'text-[9px] sm:text-[10px] mt-1.5 tracking-[0.18em]'
      : 'text-[8px] sm:text-[9px] mt-0.5 tracking-wider';

  return (
    <div
      className={`inline-flex flex-wrap items-center gap-2 sm:gap-3 ${className}`}
      role="timer"
      aria-live="polite"
      aria-label={
        left
          ? `Countdown: ${left.days} days, ${left.hours} hours, ${left.minutes} minutes, ${left.seconds} seconds`
          : 'Countdown loading'
      }
    >
      {units.map((u) => (
        <div
          key={u.label}
          className={`border border-[#FF2D87]/35 bg-[#FF2D87]/10 text-center ${box}`}
        >
          <div
            className={`font-heading text-[#FF2D87] tabular-nums leading-none ${num} ${
              left ? '' : 'invisible'
            }`}
          >
            {pad(u.value)}
          </div>
          <div className={`uppercase text-white/50 ${label}`}>{u.label}</div>
        </div>
      ))}
    </div>
  );
}
