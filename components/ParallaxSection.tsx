'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

type ParallaxSectionProps = {
  id?: string;
  className?: string;
  children: ReactNode;
  intensity?: number;
  glowSide?: 'left' | 'right' | 'both' | 'none';
};

export function ParallaxSection({
  id,
  className = '',
  children,
  intensity = 80,
  glowSide = 'right',
}: ParallaxSectionProps) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const glowY = useTransform(scrollYProgress, [0, 1], [intensity, -intensity]);
  const glowYSlow = useTransform(scrollYProgress, [0, 1], [intensity * 0.45, -intensity * 0.45]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.35, 0.65, 1], [0.25, 1, 1, 0.25]);

  return (
    <section id={id} ref={ref} className={`relative overflow-x-clip ${className}`}>
      {(glowSide === 'right' || glowSide === 'both') && (
        <motion.div
          style={{ y: glowY, opacity: glowOpacity }}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-[min(42%,28rem)] h-[min(65%,28rem)] rounded-full bg-[#FF2D87]/15 blur-[100px] pointer-events-none will-change-transform"
          aria-hidden
        />
      )}
      {(glowSide === 'left' || glowSide === 'both') && (
        <motion.div
          style={{ y: glowYSlow, opacity: glowOpacity }}
          className="absolute left-0 top-1/3 w-[min(36%,24rem)] h-[min(55%,24rem)] rounded-full bg-[#FF2D87]/12 blur-[100px] pointer-events-none will-change-transform"
          aria-hidden
        />
      )}
      <div className="relative z-10 flex flex-col w-full min-w-0">{children}</div>
    </section>
  );
}
