import { NextResponse } from 'next/server';
import { clearSession } from '@/lib/auth';

export const maxDuration = 60;

export async function POST() {
  await clearSession();
  return NextResponse.json({ success: true });
}
