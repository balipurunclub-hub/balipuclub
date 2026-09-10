import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getAloysiusConfirmedCount, getPaidCouponUseCount } from '@/lib/aloysiusRegistration';
import { applyCoupon, isJs20OfferAvailable, JS20_COUPON, normalizeCouponCode } from '@/lib/coupons';
import { getPricingForCount } from '@/lib/registrationPhases';

export const dynamic = 'force-dynamic';

const bodySchema = z.object({
  couponCode: z.string().min(1).max(32),
});

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
    const result = applyCoupon({
      code,
      baseFeeRupees: pricing.feeRupees,
      paidUseCount,
    });

    if (!result.ok) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json({
      ...result,
      phase: pricing.phase,
      offerAvailable: isJs20OfferAvailable(pricing.feeRupees, paidUseCount),
      maxUses: JS20_COUPON.maxUses,
    });
  } catch (error: unknown) {
    console.error('Validate coupon error:', error);
    const message = error instanceof Error ? error.message : 'Could not validate coupon';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
