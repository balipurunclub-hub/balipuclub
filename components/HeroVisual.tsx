'use client';

import Image from 'next/image';

/** Right-side hero artwork: runner + city, with coded overlays (no stick figure). */
export function HeroVisual() {
  return (
    <div className="relative w-full h-full min-h-0 select-none overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src="/hero-runner.png"
          alt="Runner silhouette with pink neon glow"
          fill
          priority
          className="object-cover object-[88%_42%] scale-125 lg:scale-110"
          sizes="(max-width: 1024px) 100vw, 55vw"
        />
        <div className="absolute inset-0 bg-linear-to-r from-black via-black/40 to-transparent lg:from-black/80 lg:via-transparent" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-transparent to-black/30" />
      </div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
        <span className="hero-streak hero-streak-1" />
        <span className="hero-streak hero-streak-2" />
        <span className="hero-streak hero-streak-3" />
      </div>
    </div>
  );
}
