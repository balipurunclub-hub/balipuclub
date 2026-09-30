import { NextResponse } from 'next/server';
import { desc, eq } from 'drizzle-orm';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { toRegistration } from '@/lib/db/mappers';
import { registrations } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rows = await db.select().from(registrations).orderBy(desc(registrations.createdAt));
    return NextResponse.json({ registrations: rows.map(toRegistration) });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load registrations' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const { id, ids, attended, emailSent } = body as {
      id?: string;
      ids?: string[];
      attended?: boolean;
      emailSent?: boolean;
    };

    const targetIds = ids && ids.length > 0 ? ids : id ? [id] : [];

    if (targetIds.length === 0) {
      return NextResponse.json({ error: 'Missing id or ids' }, { status: 400 });
    }

    const updates: Partial<typeof registrations.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (typeof attended === 'boolean') {
      updates.attended = attended;
      updates.attendedAt = attended ? new Date() : null;
    }
    if (typeof emailSent === 'boolean') {
      updates.emailSent = emailSent;
    }

    const rows = await db
      .update(registrations)
      .set(updates)
      .where(eq(registrations.id, targetIds[0]))
      .returning();

    if (targetIds.length > 1) {
      for (let i = 1; i < targetIds.length; i++) {
        await db
          .update(registrations)
          .set(updates)
          .where(eq(registrations.id, targetIds[i]))
          .execute();
      }
    }

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({
      updatedCount: targetIds.length,
      registration: toRegistration(rows[0]),
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 });
  }
}
