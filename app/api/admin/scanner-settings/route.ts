import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { scannerSettings } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

async function ensureSettings() {
  const rows = await db
    .select()
    .from(scannerSettings)
    .where(eq(scannerSettings.id, 'default'))
    .limit(1);
  if (rows[0]) return rows[0];

  const [created] = await db
    .insert(scannerSettings)
    .values({ id: 'default' })
    .onConflictDoNothing()
    .returning();

  if (created) return created;
  return (
    await db.select().from(scannerSettings).where(eq(scannerSettings.id, 'default')).limit(1)
  )[0];
}

export async function GET() {
  try {
    const settings = await ensureSettings();
    return NextResponse.json({
      allowFreeTierScan: settings?.allowFreeTierScan ?? true,
      allowPaidTierScan: settings?.allowPaidTierScan ?? true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const current = await ensureSettings();

    const next = {
      allowFreeTierScan:
        typeof body.allowFreeTierScan === 'boolean'
          ? body.allowFreeTierScan
          : (current?.allowFreeTierScan ?? true),
      allowPaidTierScan:
        typeof body.allowPaidTierScan === 'boolean'
          ? body.allowPaidTierScan
          : (current?.allowPaidTierScan ?? true),
      updatedAt: new Date(),
    };

    await db.update(scannerSettings).set(next).where(eq(scannerSettings.id, 'default'));

    return NextResponse.json({ success: true, ...next });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
