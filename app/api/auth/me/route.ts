import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser, toSafeUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ user: null });
    }
    const db = getDb();
    const user = await db.findUserById(session.sub);
    if (!user) {
      return NextResponse.json({ user: null });
    }
    return NextResponse.json({ user: toSafeUser(user) });
  } catch (err) {
    console.error('Auth me error:', err);
    return NextResponse.json({ user: null });
  }
}
