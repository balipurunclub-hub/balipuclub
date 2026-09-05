import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import {
  createSession,
  hashUsername,
  verifyPassword,
} from '@/lib/auth';

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
    }

    const { username, password } = parsed.data;
    const usernameHash = hashUsername(username);

    const rows = await db.select().from(users).where(eq(users.usernameHash, usernameHash)).limit(1);
    const user = rows[0];

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    await createSession(user);

    return NextResponse.json({
      success: true,
      user: { id: user.id, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
