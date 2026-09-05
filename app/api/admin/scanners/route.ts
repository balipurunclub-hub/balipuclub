import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import {
  generateRandomPassword,
  hashPassword,
  hashUsername,
  requireAdmin,
} from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const rows = await db.select().from(users).where(eq(users.role, 'scanner'));
    return NextResponse.json({
      scanners: rows.map((u) => ({
        id: u.id,
        role: u.role,
        // Username is stored hashed — show a short fingerprint only
        label: `scanner · ${u.usernameHash.slice(0, 8)}`,
        email: `scanner · ${u.usernameHash.slice(0, 8)}`,
      })),
    });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to load scanners' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const usernameHash = hashUsername(email);
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.usernameHash, usernameHash))
      .limit(1);

    if (existing[0]) {
      await db.update(users).set({ role: 'scanner' }).where(eq(users.usernameHash, usernameHash));
      return NextResponse.json({ success: true });
    }

    const tempPassword = generateRandomPassword();
    const passwordHash = await hashPassword(tempPassword);

    await db.insert(users).values({
      usernameHash,
      passwordHash,
      role: 'scanner',
    });

    return NextResponse.json({ success: true, temporaryPassword: tempPassword });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to add scanner' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get('email') || '').trim().toLowerCase();
    const id = (searchParams.get('id') || '').trim();

    if (id) {
      await db.delete(users).where(and(eq(users.id, id), eq(users.role, 'scanner')));
      return NextResponse.json({ success: true });
    }

    if (!email) {
      return NextResponse.json({ error: 'Email or id required' }, { status: 400 });
    }

    const usernameHash = hashUsername(email);
    await db
      .delete(users)
      .where(and(eq(users.usernameHash, usernameHash), eq(users.role, 'scanner')));
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to remove scanner' }, { status: 500 });
  }
}
