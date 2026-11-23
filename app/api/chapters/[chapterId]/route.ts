import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';

interface RouteContext {
  params: Promise<{ chapterId: string }>;
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

    const { chapterId } = await context.params;
    const body = await req.json();
    const quizQuestionCount =
      body.quizQuestionCount !== undefined
        ? Number(body.quizQuestionCount)
        : undefined;

    if (
      quizQuestionCount !== undefined &&
      (!Number.isFinite(quizQuestionCount) || quizQuestionCount < 1)
    ) {
      return NextResponse.json(
        { error: 'تعداد سوالات تصادفی آزمون باید حداقل ۱ باشد.' },
        { status: 400 }
      );
    }

    const db = getDb();
    const updated = await db.updateChapter(chapterId, {
      title: typeof body.title === 'string' ? body.title : undefined,
      description:
        typeof body.description === 'string' ? body.description : undefined,
      orderIndex:
        body.orderIndex !== undefined && Number.isFinite(Number(body.orderIndex))
          ? Number(body.orderIndex)
          : undefined,
      quizQuestionCount:
        quizQuestionCount !== undefined ? Math.floor(quizQuestionCount) : undefined,
    });

    if (!updated) {
      return NextResponse.json({ error: 'فصل مورد نظر یافت نشد.' }, { status: 404 });
    }
    return NextResponse.json({ chapter: updated });
  } catch (err) {
    console.error('Update chapter error:', err);
    return NextResponse.json(
      { error: 'خطا در ویرایش فصل.' },
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

    const { chapterId } = await context.params;
    const db = getDb();
    const deleted = await db.deleteChapter(chapterId);
    if (!deleted) {
      return NextResponse.json({ error: 'فصل مورد نظر یافت نشد.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete chapter error:', err);
    return NextResponse.json(
      { error: 'خطا در حذف فصل.' },
      { status: 500 }
    );
  }
}
