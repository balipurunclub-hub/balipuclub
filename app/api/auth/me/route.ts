import { NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth';

export const maxDuration = 60;

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: { id: user.id, role: user.role },
  });
}
