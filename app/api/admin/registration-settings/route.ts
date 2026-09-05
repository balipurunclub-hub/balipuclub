import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { getRegistrationAccess, setRegistrationOpen } from '@/lib/registrationAccess';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const access = await getRegistrationAccess();
    return NextResponse.json(access);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();
    if (typeof body.isOpen !== 'boolean') {
      return NextResponse.json({ error: 'isOpen boolean required' }, { status: 400 });
    }
    const result = await setRegistrationOpen(body.isOpen);
    return NextResponse.json({ success: true, ...result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
