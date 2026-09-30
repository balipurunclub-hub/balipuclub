import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAloysiusConfirmedCount, getPaidCouponUseCount } from '@/lib/aloysiusRegistration';
import { applyCoupon, normalizeCouponCode, findCoupon, isCouponAvailable, VEER30_COUPON } from '@/lib/coupons';
import { getPricingForCount, PRICING_TIERS } from '@/lib/registrationPhases';
import { db } from '@/lib/db';
import { coupons } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const bodySchema = z.object({
  couponCode: z.string().min(1).max(32),
});

type DbCouponShape = {
  code: string;
  percentOff: number;
  maxUses: number;
  validFrom: Date | null;
  validUntil: Date | null;
  minFeeRupees: number;
};

async function getDbCoupons(): Promise<DbCouponShape[]> {
  try {
    const rows = await db.select().from(coupons);
    return rows.map((r): DbCouponShape => ({
      code: r.code,
      percentOff: r.percentOff,
      maxUses: r.maxUses,
      validFrom: r.validFrom,
      validUntil: r.validUntil,
      minFeeRupees: 1,
    }));
  } catch (err) {
    console.error('getDbCoupons failed:', err);
    return [];
  }
}

/**
 * When free slots are active (feeRupees = 0), coupons can't apply to a ₹0 fee.
 * Use the first paid tier's fee instead so the coupon validation makes sense.
 * The actual registration flow will also land on paid pricing when a coupon is used
 * (the /api/register route re-checks pricing server-side).
 */
function getEffectiveFeeRupees(feeRupees: number): number {
  if (feeRupees > 0) return feeRupees;
  const firstPaidTier = PRICING_TIERS.find((t) => t.feeRupees > 0);
  return firstPaidTier?.feeRupees ?? 200;
}

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, code: 'COUPON_INVALID', error: 'Enter a coupon code.' },
        { status: 400 }
      );
    }

    const confirmedCount = await getAloysiusConfirmedCount();
    const pricing = getPricingForCount(confirmedCount);
    const code = normalizeCouponCode(parsed.data.couponCode);
    const paidUseCount = await getPaidCouponUseCount(code);
    const dbCoupons = await getDbCoupons();

    // Use effective fee — if currently free tier, validate against first paid tier fee
    const effectiveFee = getEffectiveFeeRupees(pricing.feeRupees);

    const result = applyCoupon({
      code,
      baseFeeRupees: effectiveFee,
      paidUseCount,
      dbCoupons,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    const matched = findCoupon(code, dbCoupons);

    return NextResponse.json({
      ...result,
      phase: pricing.phase,
      offerAvailable: matched ? isCouponAvailable(matched, effectiveFee, paidUseCount) : false,
      maxUses: matched?.maxUses ?? VEER30_COUPON.maxUses,
    });
  } catch (error: unknown) {
    console.error('Validate coupon error:', error);
    const message = error instanceof Error ? error.message : 'Could not validate coupon';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
