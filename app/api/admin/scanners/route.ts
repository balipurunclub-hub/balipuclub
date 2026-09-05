import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rows = await db.select().from(users).where(eq(users.role, 'scanner'));
    return NextResponse.json({
      scanners: rows.map((u) => ({ email: u.email, role: u.role, id: u.id })),
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load scanners' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing[0]) {
      await db.update(users).set({ role: 'scanner' }).where(eq(users.email, email));
      return NextResponse.json({ success: true });
    }

    await db.insert(users).values({
      email,
      passwordHash: 'auth-disabled',
      role: 'scanner',
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add scanner' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    await db.delete(users).where(and(eq(users.email, email), eq(users.role, 'scanner')));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to remove scanner' }, { status: 500 });
  }
}
