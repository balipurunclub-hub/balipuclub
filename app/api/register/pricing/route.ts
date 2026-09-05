import { NextResponse } from 'next/server';
import { getAloysiusConfirmedCount } from '@/lib/aloysiusRegistration';
import { getRegistrationAccess } from '@/lib/registrationAccess';
import {
  getPricingForCount,
  getTierStatus,
  PRICING_TIERS,
} from '@/lib/registrationPhases';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [confirmedCount, access] = await Promise.all([
      getAloysiusConfirmedCount(),
      getRegistrationAccess(),
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
    });
  } catch (error: unknown) {
    console.error('Pricing phase error:', error);
    const message = error instanceof Error ? error.message : 'Failed to load pricing';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
