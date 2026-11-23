import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت الزامی است.' }, { status: 401 });
    }

    const db = getDb();
    const attempts = await db.listExamAttemptsByUser(session.sub);

    const summaries = attempts.map((a) => ({
      id: a.id,
      bookId: a.bookId,
      chapterId: a.chapterId,
      bookTitle: a.bookTitle,
      chapterTitle: a.chapterTitle,
      totalQuestions: a.totalQuestions,
      correctCount: a.correctCount,
      wrongCount: a.wrongCount,
      unansweredCount: a.unansweredCount,
      scorePercent: a.scorePercent,
      completedAt: a.completedAt ?? a.startedAt,
    }));

    return NextResponse.json({ attempts: summaries });
  } catch (err) {
    console.error('List exam history error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت سوابق آزمون‌ها.' },
      { status: 500 }
    );
  }
}
