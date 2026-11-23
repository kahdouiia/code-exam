import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';
import { gradeExam } from '@/lib/quiz-engine';
import type { ExamResultPayload } from '@/lib/types';

interface RouteContext {
  params: Promise<{ attemptId: string }>;
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت الزامی است.' }, { status: 401 });
    }

    const { attemptId } = await context.params;
    const db = getDb();
    const attempt = await db.getExamAttemptById(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: 'آزمون مورد نظر یافت نشد.' }, { status: 404 });
    }

    if (attempt.userId !== session.sub) {
      return NextResponse.json(
        { error: 'تنها شرکت‌کننده آزمون می‌تواند پاسخ‌ها را ثبت کند.' },
        { status: 403 }
      );
    }

    if (attempt.status === 'completed') {
      const graded = gradeExam(attempt.questionsSnapshot, attempt.submittedAnswers);
      const existingResult: ExamResultPayload = {
        attemptId: attempt.id,
        bookId: attempt.bookId,
        chapterId: attempt.chapterId,
        bookTitle: attempt.bookTitle,
        chapterTitle: attempt.chapterTitle,
        totalQuestions: attempt.totalQuestions,
        correctCount: attempt.correctCount,
        wrongCount: attempt.wrongCount,
        unansweredCount: attempt.unansweredCount,
        scorePercent: attempt.scorePercent,
        completedAt: attempt.completedAt ?? attempt.startedAt,
        review: graded.review,
      };
      return NextResponse.json({ result: existingResult });
    }

    const body = await req.json();
    const rawAnswers =
      body && typeof body.answers === 'object' && body.answers !== null
        ? (body.answers as Record<string, unknown>)
        : {};

    const normalizedAnswers: Record<string, number | null> = {};
    for (const q of attempt.questionsSnapshot) {
      const val = rawAnswers[q.id];
      normalizedAnswers[q.id] =
        typeof val === 'number' && Number.isInteger(val) && val >= 0 && val <= 3
          ? val
          : null;
    }

    const graded = gradeExam(attempt.questionsSnapshot, normalizedAnswers);
    const completedAt = new Date().toISOString();

    await db.completeExamAttempt(attempt.id, {
      submittedAnswers: normalizedAnswers,
      correctCount: graded.correctCount,
      wrongCount: graded.wrongCount,
      unansweredCount: graded.unansweredCount,
      scorePercent: graded.scorePercent,
      completedAt,
    });

    const result: ExamResultPayload = {
      attemptId: attempt.id,
      bookId: attempt.bookId,
      chapterId: attempt.chapterId,
      bookTitle: attempt.bookTitle,
      chapterTitle: attempt.chapterTitle,
      totalQuestions: graded.totalQuestions,
      correctCount: graded.correctCount,
      wrongCount: graded.wrongCount,
      unansweredCount: graded.unansweredCount,
      scorePercent: graded.scorePercent,
      completedAt,
      review: graded.review,
    };

    return NextResponse.json({ result });
  } catch (err) {
    console.error('Submit exam error:', err);
    return NextResponse.json(
      { error: 'خطا در ثبت و تصحیح آزمون.' },
      { status: 500 }
    );
  }
}
