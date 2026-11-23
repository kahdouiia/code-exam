import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { attachAuthCookie, hashPassword, toSafeUser } from '@/lib/auth-server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (name.length < 2) {
      return NextResponse.json(
        { error: 'نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد.' },
        { status: 400 }
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'لطفاً یک نشانی ایمیل معتبر وارد کنید.' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'رمز عبور باید حداقل ۶ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = await db.findUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: 'این ایمیل قبلاً ثبت‌نام شده است.' },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(password);
    const created = await db.createUser({
      name,
      email,
      passwordHash,
      role: 'user',
    });

    const safeUser = toSafeUser(created);
    const res = NextResponse.json({ user: safeUser }, { status: 201 });
    const token = await attachAuthCookie(res, safeUser);
    return NextResponse.json(
      { user: safeUser, token },
      {
        status: 201,
        headers: res.headers,
      }
    );
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json(
      { error: 'خطایی هنگام ثبت‌نام رخ داد. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
