import { ALOYSIUS_EVENT_ID } from '@/lib/registrationPhases';

export type CouponConfig = {
  code: string;
  percentOff: number;
  maxUses: number;
  /** If set, coupon only valid when current phase base fee exactly equals this */
  requiresFeeRupees?: number;
  /** If set, coupon only valid when baseFeeRupees >= this threshold */
  minFeeRupees?: number;
};

export const VEER30_COUPON: CouponConfig = {
  code: 'VEER30',
  percentOff: 30,
  maxUses: 140,
  minFeeRupees: 1,
};

export const COUPONS: CouponConfig[] = [VEER30_COUPON];

export function normalizeCouponCode(input: string | null | undefined): string {
  return (input ?? '').trim().toUpperCase();
}

export type CouponApplyOk = {
  ok: true;
  couponCode: string;
  feeRupees: number;
  originalFeeRupees: number;
  percentOff: number;
  remainingUses: number;
};

export type CouponApplyErr = {
  ok: false;
  error: string;
  code: 'COUPON_INVALID' | 'COUPON_NOT_APPLICABLE' | 'COUPON_EXHAUSTED';
};

export type CouponApplyResult = CouponApplyOk | CouponApplyErr;

export function findCoupon(code: string): CouponConfig | undefined {
  const normalized = normalizeCouponCode(code);
  return COUPONS.find((c) => c.code === normalized);
}

function formatCouponNotApplicable(config: CouponConfig): string {
  if (config.requiresFeeRupees !== undefined) {
    return `This coupon is only valid in Phase 2 (₹${config.requiresFeeRupees}).`;
  }
  if (config.minFeeRupees !== undefined && config.minFeeRupees > 0) {
    return 'This coupon is only valid for paid registrations.';
  }
  return 'This coupon is not applicable to the current pricing phase.';
}

export function applyCoupon(args: {
  code: string;
  baseFeeRupees: number;
  paidUseCount: number;
}): CouponApplyResult {
  const config = findCoupon(args.code);
  if (!config) {
    return {
      ok: false,
      code: 'COUPON_INVALID',
      error: 'Invalid coupon code.',
    };
  }

  if (config.requiresFeeRupees !== undefined && args.baseFeeRupees !== config.requiresFeeRupees) {
    return {
      ok: false,
      code: 'COUPON_NOT_APPLICABLE',
      error: formatCouponNotApplicable(config),
    };
  }

  if (config.minFeeRupees !== undefined && args.baseFeeRupees < config.minFeeRupees) {
    return {
      ok: false,
      code: 'COUPON_NOT_APPLICABLE',
      error: formatCouponNotApplicable(config),
    };
  }

  if (args.paidUseCount >= config.maxUses) {
    return {
      ok: false,
      code: 'COUPON_EXHAUSTED',
      error: 'This coupon has reached its usage limit.',
    };
  }

  const feeRupees = Math.round(args.baseFeeRupees * (1 - config.percentOff / 100));

  return {
    ok: true,
    couponCode: config.code,
    feeRupees,
    originalFeeRupees: args.baseFeeRupees,
    percentOff: config.percentOff,
    remainingUses: config.maxUses - args.paidUseCount,
  };
}

export function isCouponAvailable(config: CouponConfig, baseFeeRupees: number, paidUseCount: number): boolean {
  if (config.requiresFeeRupees !== undefined && baseFeeRupees !== config.requiresFeeRupees) return false;
  if (config.minFeeRupees !== undefined && baseFeeRupees < config.minFeeRupees) return false;
  return paidUseCount < config.maxUses;
}

export { ALOYSIUS_EVENT_ID };
