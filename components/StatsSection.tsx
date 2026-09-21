'use client';

import { Users, Calendar, MapPin, Heart } from 'lucide-react';
import { CountUp } from '@/components/CountUp';

const stats = [
  { icon: Users, value: '600+', label: 'Runners', countTo: 600 as number | null },
  { icon: Calendar, value: '3+', label: 'Events', countTo: 3 as number | null },
  { icon: MapPin, value: '1', label: 'City', countTo: null },
  { icon: Heart, value: 'A Stronger', label: 'Community', countTo: null },
];

export function StatsSection() {
  return (
    <div className="relative z-10 border-t border-white/10 bg-black/90 backdrop-blur-sm">
      <div className="site-container">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-white/10">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center gap-1.5 sm:gap-2 py-6 sm:py-8 px-2 sm:px-4 text-center min-w-0"
            >
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF2D87]" strokeWidth={1.75} />
              <div className="min-w-0">
                <div className="text-[#FF2D87] font-heading text-xl sm:text-2xl md:text-3xl tracking-wide uppercase break-words">
                  {stat.countTo != null ? (
                    <CountUp to={stat.countTo} suffix="+" durationMs={3200} />
                  ) : (
                    stat.value
                  )}
                </div>
                <div className="text-white/70 text-[0.65rem] sm:text-xs md:text-sm font-medium tracking-[0.12em] sm:tracking-[0.2em] uppercase mt-1 break-words">
                  {stat.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
