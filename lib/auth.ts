import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, type User } from '@/lib/db/schema';

const SESSION_COOKIE = 'balipu_admin_session';
const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 days

function authPepper(): string {
  return process.env.AUTH_PEPPER || process.env.SESSION_SECRET || 'balipu-dev-pepper-change-me';
}

function sessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.AUTH_PEPPER || 'balipu-dev-secret-change-me';
}

/** Deterministic hash of username/email for DB lookup (never stores plain username). */
export function hashUsername(username: string): string {
  const normalized = username.trim().toLowerCase();
  return createHash('sha256').update(`${authPepper()}:${normalized}`).digest('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function generateRandomPassword(bytes = 12): string {
  return randomBytes(bytes).toString('base64url');
}

type SessionPayload = {
  userId: string;
  role: string;
  exp: number;
};

function signSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = createHash('sha256').update(`${body}.${sessionSecret()}`).digest('base64url');
  return `${body}.${sig}`;
}

function verifySessionToken(token: string): SessionPayload | null {
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const expected = createHash('sha256').update(`${body}.${sessionSecret()}`).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.userId || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user: User) {
  const token = signSession({
    userId: user.id,
    role: user.role,
    exp: Date.now() + SESSION_MAX_AGE_SEC * 1000,
  });

  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function getSessionUser(): Promise<User | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  const rows = await db.select().from(users).where(eq(users.id, payload.userId)).limit(1);
  return rows[0] ?? null;
}

export async function requireAdmin(): Promise<User | null> {
  const user = await getSessionUser();
  if (!user || user.role !== 'admin') return null;
  return user;
}
