import { ALOYSIUS_EVENT_ID } from '@/lib/registrationPhases';

export type CouponConfig = {
  code: string;
  percentOff: number;
  maxUses: number;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
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

export const STATIC_COUPONS: CouponConfig[] = [VEER30_COUPON];

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
  code: 'COUPON_INVALID' | 'COUPON_NOT_APPLICABLE' | 'COUPON_EXHAUSTED' | 'COUPON_EXPIRED';
};

export type CouponApplyResult = CouponApplyOk | CouponApplyErr;

export function isCouponWithinValidity(config: CouponConfig, now: Date = new Date()): boolean {
  if (config.validFrom) {
    const from = config.validFrom instanceof Date ? config.validFrom : new Date(config.validFrom);
    if (now < from) return false;
  }
  if (config.validUntil) {
    const until = config.validUntil instanceof Date ? config.validUntil : new Date(config.validUntil);
    if (now > until) return false;
  }
  return true;
}

export function formatCouponNotApplicable(config: CouponConfig, now: Date = new Date()): string {
  if (!isCouponWithinValidity(config, now)) {
    if (config.validFrom) {
      const from = config.validFrom instanceof Date ? config.validFrom : new Date(config.validFrom);
      if (now < from) {
        return `This coupon is not yet valid. It will be active from ${from.toLocaleDateString()}.`;
      }
    }
    if (config.validUntil) {
      const until = config.validUntil instanceof Date ? config.validUntil : new Date(config.validUntil);
      if (now > until) {
        return `This coupon expired on ${until.toLocaleDateString()}.`;
      }
    }
    return 'This coupon is outside its validity period.';
  }
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
  dbCoupons?: CouponConfig[];
}): CouponApplyResult {
  const normalized = normalizeCouponCode(args.code);
  const dbList = args.dbCoupons ?? [];
  const config =
    dbList.find((c) => normalizeCouponCode(c.code) === normalized) ??
    STATIC_COUPONS.find((c) => c.code === normalized);

  if (!config) {
    return {
      ok: false,
      code: 'COUPON_INVALID',
      error: 'Invalid coupon code.',
    };
  }

  if (!isCouponWithinValidity(config)) {
    return {
      ok: false,
      code: 'COUPON_EXPIRED',
      error: formatCouponNotApplicable(config),
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

export function findCoupon(code: string, dbCoupons?: CouponConfig[]): CouponConfig | undefined {
  const normalized = normalizeCouponCode(code);
  const dbList = dbCoupons ?? [];
  return (
    dbList.find((c) => normalizeCouponCode(c.code) === normalized) ??
    STATIC_COUPONS.find((c) => c.code === normalized)
  );
}

export function isCouponAvailable(
  config: CouponConfig,
  baseFeeRupees: number,
  paidUseCount: number,
  now: Date = new Date()
): boolean {
  if (!isCouponWithinValidity(config, now)) return false;
  if (config.requiresFeeRupees !== undefined && baseFeeRupees !== config.requiresFeeRupees) return false;
  if (config.minFeeRupees !== undefined && baseFeeRupees < config.minFeeRupees) return false;
  return paidUseCount < config.maxUses;
}

export { ALOYSIUS_EVENT_ID };
