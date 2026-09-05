'use client';

import { useEffect, useRef, useState } from 'react';

type CountUpProps = {
  to: number;
  suffix?: string;
  durationMs?: number;
  className?: string;
};

export function CountUp({ to, suffix = '', durationMs = 2800, className = '' }: CountUpProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const start = () => {
      if (started.current) return;
      started.current = true;

      if (prefersReduced) {
        setValue(to);
        return;
      }

      const startTime = performance.now();
      // Ease-out cubic — starts a bit faster, settles slowly into 600
      const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        setValue(Math.round(easeOut(progress) * to));
        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
      },
      { threshold: 0.4 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [to, durationMs]);

  return (
    <div ref={ref} className={className}>
      {value}
      {suffix}
    </div>
  );
}
