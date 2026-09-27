import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAloysiusConfirmedCount, getPaidCouponUseCount } from '@/lib/aloysiusRegistration';
import { applyCoupon, normalizeCouponCode, findCoupon, isCouponAvailable, VEER30_COUPON } from '@/lib/coupons';
import { getPricingForCount } from '@/lib/registrationPhases';
import { db } from '@/lib/db';
import { coupons } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

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
  } catch {
    return [];
  }
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
    const result = applyCoupon({
      code,
      baseFeeRupees: pricing.feeRupees,
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
      offerAvailable: matched ? isCouponAvailable(matched, pricing.feeRupees, paidUseCount) : false,
      maxUses: matched?.maxUses ?? VEER30_COUPON.maxUses,
    });
  } catch (error: unknown) {
    console.error('Validate coupon error:', error);
    const message = error instanceof Error ? error.message : 'Could not validate coupon';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
