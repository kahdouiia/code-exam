import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';

interface RouteContext {
  params: Promise<{ bookId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const { bookId } = await context.params;
    const session = await getSessionUser(req);
    const db = getDb();
    const book = await db.getBookWithChapters(bookId, session?.sub ?? null);
    if (!book) {
      return NextResponse.json({ error: 'کتاب مورد نظر یافت نشد.' }, { status: 404 });
    }
    return NextResponse.json({ book });
  } catch (err) {
    console.error('Get book error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات کتاب.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت الزامی است.' }, { status: 401 });
    }
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'دسترسی فقط برای مدیر مجاز است.' }, { status: 403 });
    }

    const { bookId } = await context.params;
    const body = await req.json();
    const db = getDb();
    const updated = await db.updateBook(bookId, {
      title: typeof body.title === 'string' ? body.title : undefined,
      author: typeof body.author === 'string' ? body.author : undefined,
      description:
        typeof body.description === 'string' ? body.description : undefined,
      topic: typeof body.topic === 'string' ? body.topic : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'کتاب مورد نظر یافت نشد.' }, { status: 404 });
    }
    return NextResponse.json({ book: updated });
  } catch (err) {
    console.error('Update book error:', err);
    return NextResponse.json(
      { error: 'خطا در ویرایش کتاب.' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت الزامی است.' }, { status: 401 });
    }
    if (session.role !== 'admin') {
      return NextResponse.json({ error: 'دسترسی فقط برای مدیر مجاز است.' }, { status: 403 });
    }

    const { bookId } = await context.params;
    const db = getDb();
    const removed = await db.deleteBook(bookId);
    if (!removed) {
      return NextResponse.json({ error: 'کتاب مورد نظر یافت نشد.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete book error:', err);
    return NextResponse.json(
      { error: 'خطا در حذف کتاب.' },
      { status: 500 }
    );
  }
}
