import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';
import { parseQuestionsJson } from '@/lib/quiz-parser';

interface RouteContext {
  params: Promise<{ chapterId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
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
    const chapter = await db.getChapterById(chapterId);
    if (!chapter) {
      return NextResponse.json({ error: 'فصل مورد نظر یافت نشد.' }, { status: 404 });
    }

    const questions = await db.listQuestionsByChapter(chapterId);
    return NextResponse.json({ chapter, questions });
  } catch (err) {
    console.error('List chapter questions error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت سوالات فصل.' },
      { status: 500 }
    );
  }
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

    const { chapterId } = await context.params;
    const db = getDb();
    const chapter = await db.getChapterById(chapterId);
    if (!chapter) {
      return NextResponse.json({ error: 'فصل مورد نظر یافت نشد.' }, { status: 404 });
    }

    const body = await req.json();
    const mode: 'append' | 'replace' =
      body.mode === 'replace' ? 'replace' : 'append';

    const rawJson =
      typeof body.rawJson === 'string'
        ? body.rawJson
        : JSON.stringify(body.questions ?? []);

    const parsed = parseQuestionsJson(rawJson);
    if (!parsed.ok) {
      return NextResponse.json(
        {
          error: parsed.errors[0] || 'ساختار JSON معتبر نیست.',
          errors: parsed.errors,
        },
        { status: 400 }
      );
    }

    const saved = await db.saveQuestionsForChapter(
      chapterId,
      parsed.questions,
      mode
    );

    return NextResponse.json(
      {
        addedCount: parsed.questions.length,
        totalQuestions: saved.length,
        questions: saved,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Upload chapter questions error:', err);
    return NextResponse.json(
      { error: 'خطا در ذخیره بانک سوالات.' },
      { status: 500 }
    );
  }
}
