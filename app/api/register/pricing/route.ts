import { NextResponse } from 'next/server';
import { getAloysiusConfirmedCount, getPaidCouponUseCount } from '@/lib/aloysiusRegistration';
import { getRegistrationAccess } from '@/lib/registrationAccess';
import {
  getPricingForCount,
  getTierStatus,
  PRICING_TIERS,
} from '@/lib/registrationPhases';
import { isJs20OfferAvailable, JS20_COUPON } from '@/lib/coupons';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [confirmedCount, access, js20PaidUses] = await Promise.all([
      getAloysiusConfirmedCount(),
      getRegistrationAccess(),
      getPaidCouponUseCount(JS20_COUPON.code),
    ]);
    const active = getPricingForCount(confirmedCount);

    const tiers = PRICING_TIERS.map((tier) => ({
      ...tier,
      status: getTierStatus(tier, confirmedCount),
    }));

    return NextResponse.json({
      confirmedCount,
      active,
      tiers,
      registrationOpen: access.isOpen,
      scheduledUnlockAt: access.scheduledUnlockAt,
      scheduledUnlockLabel: access.scheduledUnlockLabel,
      coupon: {
        offerAvailable: isJs20OfferAvailable(active.feeRupees, js20PaidUses),
        remainingUses: Math.max(0, JS20_COUPON.maxUses - js20PaidUses),
      },
    });
  } catch (error: unknown) {
    console.error('Pricing phase error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load pricing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
