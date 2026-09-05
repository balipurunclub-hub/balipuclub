/**
 * Balipu x Aloysius registration pricing phases.
 * Phases unlock automatically from confirmed (paid/free) registration count.
 *
 * Slot numbers are 1-based (registration #1, #2, …):
 *   1–10   → Free
 *   11–100 → ₹200  (Phase 1)
 *   101–200 → ₹250 (Phase 2)
 *   201–300 → ₹300 (Phase 3)
 *   301+    → ₹350 (Phase 4)
 */

export const ALOYSIUS_EVENT_ID = 'balipu-x-aloysius';
export const ALOYSIUS_EVENT_NAME = 'Balipu x Aloysius';

export type PhaseStatus = 'filled' | 'active' | 'locked';

export type PricingTier = {
  id: string;
  phase: number;
  label: string;
  rangeLabel: string;
  /** Inclusive 1-based slot start */
  minSlot: number;
  /** Inclusive 1-based slot end; null = open-ended */
  maxSlot: number | null;
  feeRupees: number;
};

/** Display tiers (includes Free as its own row under Phase 1). */
export const PRICING_TIERS: PricingTier[] = [
  {
    id: 'phase1-free',
    phase: 1,
    label: 'Phase 1 · Free',
    rangeLabel: '0 – 10',
    minSlot: 1,
    maxSlot: 10,
    feeRupees: 0,
  },
  {
    id: 'phase1-paid',
    phase: 1,
    label: 'Phase 1',
    rangeLabel: '11 – 100',
    minSlot: 11,
    maxSlot: 100,
    feeRupees: 200,
  },
  {
    id: 'phase2',
    phase: 2,
    label: 'Phase 2',
    rangeLabel: '101 – 200',
    minSlot: 101,
    maxSlot: 200,
    feeRupees: 250,
  },
  {
    id: 'phase3',
    phase: 3,
    label: 'Phase 3',
    rangeLabel: '201 – 300',
    minSlot: 201,
    maxSlot: 300,
    feeRupees: 300,
  },
  {
    id: 'phase4',
    phase: 4,
    label: 'Phase 4',
    rangeLabel: '301 & above',
    minSlot: 301,
    maxSlot: null,
    feeRupees: 350,
  },
];

export type ActivePricing = {
  tierId: string;
  phase: number;
  label: string;
  rangeLabel: string;
  feeRupees: number;
  entryType: 'free' | 'paid';
  /** How many confirmed registrations so far */
  confirmedCount: number;
  /** Next slot number being sold (1-based) */
  nextSlot: number;
};

export function getPricingForCount(confirmedCount: number): ActivePricing {
  const nextSlot = Math.max(0, confirmedCount) + 1;
  const tier =
    PRICING_TIERS.find(
      (t) => nextSlot >= t.minSlot && (t.maxSlot === null || nextSlot <= t.maxSlot)
    ) ?? PRICING_TIERS[PRICING_TIERS.length - 1];

  return {
    tierId: tier.id,
    phase: tier.phase,
    label: tier.label,
    rangeLabel: tier.rangeLabel,
    feeRupees: tier.feeRupees,
    entryType: tier.feeRupees === 0 ? 'free' : 'paid',
    confirmedCount: Math.max(0, confirmedCount),
    nextSlot,
  };
}

export function getTierStatus(
  tier: PricingTier,
  confirmedCount: number
): PhaseStatus {
  const nextSlot = confirmedCount + 1;
  if (tier.maxSlot !== null && confirmedCount >= tier.maxSlot) return 'filled';
  if (nextSlot >= tier.minSlot && (tier.maxSlot === null || nextSlot <= tier.maxSlot)) {
    return 'active';
  }
  return 'locked';
}

export function feeRupeesToPaise(feeRupees: number): number {
  return Math.round(feeRupees * 100);
}
