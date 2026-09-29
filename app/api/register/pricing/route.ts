import { NextResponse } from 'next/server';
import { getAloysiusConfirmedCount, getPaidCouponUseCount } from '@/lib/aloysiusRegistration';
import { getRegistrationAccess } from '@/lib/registrationAccess';
import {
  getPricingForCount,
  getTierStatus,
  PRICING_TIERS,
} from '@/lib/registrationPhases';
import { isCouponAvailable, VEER30_COUPON } from '@/lib/coupons';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    const [confirmedCount, access, veer30PaidUses] = await Promise.all([
      getAloysiusConfirmedCount(),
      getRegistrationAccess(),
      getPaidCouponUseCount(VEER30_COUPON.code),
    ]);
    const active = getPricingForCount(confirmedCount);

    const tiers = PRICING_TIERS.map((tier) => ({
      ...tier,
      status: getTierStatus(tier, confirmedCount),
    }));

    const veer30Available = isCouponAvailable(VEER30_COUPON, active.feeRupees, veer30PaidUses);

    return NextResponse.json({
      confirmedCount,
      active,
      tiers,
      registrationOpen: access.isOpen,
      scheduledUnlockAt: access.scheduledUnlockAt,
      scheduledUnlockLabel: access.scheduledUnlockLabel,
      coupon: {
        offerAvailable: veer30Available,
        remainingUses: Math.max(0, VEER30_COUPON.maxUses - veer30PaidUses),
        coupons: [
          {
            code: VEER30_COUPON.code,
            available: veer30Available,
            remainingUses: Math.max(0, VEER30_COUPON.maxUses - veer30PaidUses),
          },
        ],
      },
    });
  } catch (error: unknown) {
    console.error('Pricing phase error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load pricing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
