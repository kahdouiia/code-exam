import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const db = getDb();
    const books = await db.listBooksWithChapters(session?.sub ?? null);
    return NextResponse.json({ books });
  } catch (err) {
    console.error('List books error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت فهرست کتاب‌ها.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'ابتدا وارد حساب کاربری شوید.' }, { status: 401 });
    }
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'دسترسی فقط برای مدیر مجاز است.' }, { status: 403 });
    }

    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const author = typeof body.author === 'string' ? body.author.trim() : '';
    const description =
      typeof body.description === 'string' ? body.description.trim() : '';
    const topic =
      typeof body.topic === 'string' && body.topic.trim()
        ? body.topic.trim()
        : 'مهندسی نرم‌افزار';

    if (title.length < 2) {
      return NextResponse.json(
        { error: 'عنوان کتاب باید حداقل ۲ کاراکتر باشد.' },
        { status: 400 }
      );
    }
    if (author.length < 2) {
      return NextResponse.json(
        { error: 'نام نویسنده باید حداقل ۲ کاراکتر باشد.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const book = await db.createBook({ title, author, description, topic });
    return NextResponse.json({ book }, { status: 201 });
  } catch (err) {
    console.error('Create book error:', err);
    return NextResponse.json(
      { error: 'خطا در ثبت کتاب جدید.' },
      { status: 500 }
    );
  }
}
