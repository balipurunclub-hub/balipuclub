import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq, sql } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { coupons, registrations } from '@/lib/db/schema';
import { normalizeCouponCode, STATIC_COUPONS } from '@/lib/coupons';
import { ALOYSIUS_EVENT_ID } from '@/lib/registrationPhases';

export const dynamic = 'force-dynamic';

const createSchema = z.object({
  code: z.string().min(1).max(32),
  percentOff: z.number().int().min(0).max(100),
  maxUses: z.number().int().min(1),
  validFrom: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
});

async function getCouponUseCount(code: string): Promise<number> {
  const normalized = normalizeCouponCode(code);
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(registrations)
    .where(
      sql`${registrations.eventId} = ${ALOYSIUS_EVENT_ID}
        AND ${registrations.paymentStatus} = 'paid'
        AND upper(${registrations.couponCode}) = ${normalized}`
    );
  return Number(rows[0]?.count ?? 0);
}

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    type ApiCoupon = {
      id: string;
      code: string;
      percentOff: number;
      maxUses: number;
      usedCount: number;
      validFrom: Date | string | null;
      validUntil: Date | string | null;
      createdAt: Date | string;
      updatedAt?: Date | string;
      isStatic?: boolean;
    };

    const staticList: ApiCoupon[] = [];
    for (const sc of STATIC_COUPONS) {
      staticList.push({
        id: `static-${sc.code}`,
        code: sc.code,
        percentOff: sc.percentOff,
        maxUses: sc.maxUses,
        validFrom: sc.validFrom ?? null,
        validUntil: sc.validUntil ?? null,
        createdAt: new Date(0),
        usedCount: 0,
        isStatic: true,
      });
    }

    let dbCoupons: ApiCoupon[] = [];
    try {
      const rows = await db.select().from(coupons).orderBy(coupons.createdAt);
      dbCoupons = await Promise.all(
        rows.map(async (c) => ({
          id: typeof c.id === 'string' ? c.id : String(c.id),
          code: c.code,
          percentOff: c.percentOff,
          maxUses: c.maxUses,
          validFrom: c.validFrom,
          validUntil: c.validUntil,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          usedCount: 0,
        }))
      );
    } catch (dbErr) {
      // Table likely doesn't exist yet — skip db coupons and show only static ones.
      console.warn('coupons table missing (safe to ignore during setup):', dbErr instanceof Error ? dbErr.message : dbErr);
      dbCoupons = [];
    }

    // Compute used counts AFTER static + db combined so counts work even w/o table
    const allRaw: ApiCoupon[] = [...staticList, ...dbCoupons];
    const all: ApiCoupon[] = await Promise.all(
      allRaw.map(async (c) => ({ ...c, usedCount: await getCouponUseCount(c.code) }))
    );

    return NextResponse.json({ coupons: all });
  } catch (error: unknown) {
    console.error('Get coupons error:', error);
    return NextResponse.json({ error: 'Failed to load coupons' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid coupon data' }, { status: 400 });
    }

    const code = normalizeCouponCode(parsed.data.code);

    if (!/^[A-Z0-9_-]+$/.test(code)) {
      return NextResponse.json(
        { error: 'Coupon code may only contain letters, numbers, underscores, and dashes.' },
        { status: 400 }
      );
    }

    const STATIC_TABLE_HINT =
      ' Please first create the coupons table by running: npm run db:push';

    let existing: { code: string }[] = [];
    try {
      existing = await db
        .select()
        .from(coupons)
        .where(eq(coupons.code, code))
        .limit(1);
    } catch (dbErr) {
      console.error('POST coupons table error:', dbErr);
      return NextResponse.json(
        { error: `Database coupons table is not ready yet.${STATIC_TABLE_HINT}` },
        { status: 500 }
      );
    }

    if (existing.length > 0) {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 409 });
    }

    const validFrom = parsed.data.validFrom ? new Date(parsed.data.validFrom) : null;
    const validUntil = parsed.data.validUntil ? new Date(parsed.data.validUntil) : null;

    if (validFrom && validUntil && validFrom > validUntil) {
      return NextResponse.json(
        { error: 'Valid from date cannot be after valid until date.' },
        { status: 400 }
      );
    }

    try {
      const [inserted] = await db
        .insert(coupons)
        .values({
          code,
          percentOff: parsed.data.percentOff,
          maxUses: parsed.data.maxUses,
          validFrom,
          validUntil,
        })
        .returning();

      return NextResponse.json({ coupon: { ...inserted, usedCount: 0 } });
    } catch (dbErr) {
      console.error('POST coupons insert error:', dbErr);
      return NextResponse.json(
        { error: `Could not create voucher — database coupons table is missing.${STATIC_TABLE_HINT}` },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Create coupon error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create coupon' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const id = (searchParams.get('id') || '').trim();
    const code = normalizeCouponCode(searchParams.get('code') || '');

    if (id && id.startsWith('static-')) {
      return NextResponse.json(
        { error: 'Static coupons (e.g. VEER30) cannot be deleted from the admin panel.' },
        { status: 400 }
      );
    }
    if (code) {
      const isStatic = STATIC_COUPONS.some(
        (s) => normalizeCouponCode(s.code) === code
      );
      if (isStatic) {
        return NextResponse.json(
          { error: 'Static coupons (e.g. VEER30) cannot be deleted from the admin panel.' },
          { status: 400 }
        );
      }
    }

    const TABLE_HINT = ' Coupons table missing — run: npm run db:push';

    if (id) {
      try {
        const result = await db
          .delete(coupons)
          .where(eq(coupons.id, id))
          .returning({ id: coupons.id, code: coupons.code });
        if (result.length === 0) {
          return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, deleted: result[0] });
      } catch (dbErr) {
        console.error('DELETE coupons by id error:', dbErr);
        return NextResponse.json(
          { error: `Failed to delete voucher.${TABLE_HINT}` },
          { status: 500 }
        );
      }
    }

    if (code) {
      try {
        const result = await db
          .delete(coupons)
          .where(eq(coupons.code, code))
          .returning({ id: coupons.id, code: coupons.code });
        if (result.length === 0) {
          return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
        }
        return NextResponse.json({ success: true, deleted: result[0] });
      } catch (dbErr) {
        console.error('DELETE coupons by code error:', dbErr);
        return NextResponse.json(
          { error: `Failed to delete voucher.${TABLE_HINT}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ error: 'Coupon id or code required' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Delete coupon error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete coupon' },
      { status: 500 }
    );
  }
}
