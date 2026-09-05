import { NextResponse } from 'next/server';
import { desc, eq, or } from 'drizzle-orm';
import { db } from '@/lib/db';
import { toRegistration } from '@/lib/db/mappers';
import { registrations } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get('ticketId')?.trim();
    const id = searchParams.get('id')?.trim();
    const attendedOnly = searchParams.get('attended') === 'true';

    if (attendedOnly) {
      const rows = await db
        .select()
        .from(registrations)
        .where(eq(registrations.attended, true))
        .orderBy(desc(registrations.attendedAt));
      return NextResponse.json({
        registrations: rows.map(toRegistration),
        count: rows.length,
      });
    }

    if (!ticketId && !id) {
      return NextResponse.json({ error: 'ticketId or id required' }, { status: 400 });
    }

    let rows;
    if (ticketId && id) {
      rows = await db
        .select()
        .from(registrations)
        .where(or(eq(registrations.ticketId, ticketId), eq(registrations.id, id)))
        .limit(5);
    } else if (ticketId) {
      rows = await db
        .select()
        .from(registrations)
        .where(eq(registrations.ticketId, ticketId))
        .limit(5);
    } else {
      rows = await db.select().from(registrations).where(eq(registrations.id, id!)).limit(5);
    }

    return NextResponse.json({
      registrations: rows.map(toRegistration),
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, linkedDocId } = body as { id?: string; linkedDocId?: string };

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const now = new Date();
    const [row] = await db
      .update(registrations)
      .set({ attended: true, attendedAt: now, updatedAt: now })
      .where(eq(registrations.id, id))
      .returning();

    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (linkedDocId) {
      await db
        .update(registrations)
        .set({ attended: true, attendedAt: now, updatedAt: now })
        .where(eq(registrations.id, linkedDocId));
    }

    if (row.linkedDocId) {
      await db
        .update(registrations)
        .set({ attended: true, attendedAt: now, updatedAt: now })
        .where(eq(registrations.id, row.linkedDocId));
    }

    return NextResponse.json({ registration: toRegistration(row) });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Check-in failed' }, { status: 500 });
  }
}
