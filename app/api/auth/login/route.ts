import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { attachAuthCookie, toSafeUser, verifyPassword } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'ایمیل و رمز عبور الزامی هستند.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const user = await db.findUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'ایمیل یا رمز عبور نادرست است.' },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        { error: 'ایمیل یا رمز عبور نادرست است.' },
        { status: 401 }
      );
    }

    const safeUser = toSafeUser(user);
    const res = NextResponse.json({ user: safeUser });
    const token = await attachAuthCookie(res, safeUser);
    return NextResponse.json(
      { user: safeUser, token },
      {
        status: 200,
        headers: res.headers,
      }
    );
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: 'خطایی هنگام ورود رخ داد.' },
      { status: 500 }
    );
  }
}
