import { ALOYSIUS_EVENT_ID } from '@/lib/registrationPhases';

export type CouponConfig = {
  code: string;
  percentOff: number;
  maxUses: number;
  /** Only valid when current phase base fee equals this */
  requiresFeeRupees: number;
};

export const JS20_COUPON: CouponConfig = {
  code: 'JS20',
  percentOff: 20,
  maxUses: 50,
  requiresFeeRupees: 250,
};

export const COUPONS: CouponConfig[] = [JS20_COUPON];

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

  if (args.baseFeeRupees !== config.requiresFeeRupees) {
    return {
      ok: false,
      code: 'COUPON_NOT_APPLICABLE',
      error: 'This coupon is only valid in Phase 2 (₹250).',
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

/** Whether the Phase 2 coupon popup should be offered for the current base fee. */
export function isJs20OfferAvailable(baseFeeRupees: number, paidUseCount: number): boolean {
  return (
    baseFeeRupees === JS20_COUPON.requiresFeeRupees && paidUseCount < JS20_COUPON.maxUses
  );
}
