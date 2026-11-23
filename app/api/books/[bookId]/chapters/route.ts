import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';

interface RouteContext {
  params: Promise<{ bookId: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
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
    const book = await db.getBookWithChapters(bookId);
    if (!book) {
      return NextResponse.json({ error: 'کتاب مورد نظر یافت نشد.' }, { status: 404 });
    }

    const body = await req.json();
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const description =
      typeof body.description === 'string' ? body.description.trim() : '';
    const quizQuestionCount = Number(body.quizQuestionCount ?? 5);
    const orderIndex =
      body.orderIndex !== undefined && Number.isFinite(Number(body.orderIndex))
        ? Number(body.orderIndex)
        : undefined;

    if (title.length < 2) {
      return NextResponse.json(
        { error: 'عنوان فصل باید حداقل ۲ کاراکتر باشد.' },
        { status: 400 }
      );
    }
    if (!Number.isFinite(quizQuestionCount) || quizQuestionCount < 1) {
      return NextResponse.json(
        { error: 'تعداد سوالات تصادفی آزمون باید حداقل ۱ باشد.' },
        { status: 400 }
      );
    }

    const chapter = await db.createChapter({
      bookId,
      title,
      description,
      orderIndex,
      quizQuestionCount: Math.floor(quizQuestionCount),
    });

    return NextResponse.json({ chapter }, { status: 201 });
  } catch (err) {
    console.error('Create chapter error:', err);
    return NextResponse.json(
      { error: 'خطا در ایجاد فصل جدید.' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, context: RouteContext) {
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
    if (!Array.isArray(body.orderedChapterIds)) {
      return NextResponse.json(
        { error: 'لیست ترتیب فصل‌ها معتبر نیست.' },
        { status: 400 }
      );
    }

    const db = getDb();
    await db.reorderChapters(bookId, body.orderedChapterIds.map(String));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Reorder chapters error:', err);
    return NextResponse.json(
      { error: 'خطا در تغییر ترتیب فصل‌ها.' },
      { status: 500 }
    );
  }
}
