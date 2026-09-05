import { NextResponse } from 'next/server';
import { getAloysiusConfirmedCount } from '@/lib/aloysiusRegistration';
import {
  getPricingForCount,
  getTierStatus,
  PRICING_TIERS,
} from '@/lib/registrationPhases';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const confirmedCount = await getAloysiusConfirmedCount();
    const active = getPricingForCount(confirmedCount);

    const tiers = PRICING_TIERS.map((tier) => ({
      ...tier,
      status: getTierStatus(tier, confirmedCount),
    }));

    return NextResponse.json({
      confirmedCount,
      active,
      tiers,
    });
  } catch (error: unknown) {
    console.error('Pricing phase error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load pricing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
