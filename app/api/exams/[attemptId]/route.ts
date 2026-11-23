import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';
import { gradeExam } from '@/lib/quiz-engine';
import type { ExamResultPayload, PublicQuestion } from '@/lib/types';

interface RouteContext {
  params: Promise<{ attemptId: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
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

    if (attempt.userId !== session.sub && session.role !== 'admin') {
      return NextResponse.json({ error: 'شما مجاز به مشاهده این آزمون نیستید.' }, { status: 403 });
    }

    if (attempt.status === 'completed') {
      const graded = gradeExam(attempt.questionsSnapshot, attempt.submittedAnswers);
      const result: ExamResultPayload = {
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
      return NextResponse.json({ status: 'completed', result });
    }

    const publicQuestions: PublicQuestion[] = attempt.questionsSnapshot.map((q) => ({
      id: q.id,
      question: q.question,
      answers: q.answers,
    }));

    return NextResponse.json({
      status: 'in_progress',
      attempt: {
        attemptId: attempt.id,
        bookId: attempt.bookId,
        chapterId: attempt.chapterId,
        bookTitle: attempt.bookTitle,
        chapterTitle: attempt.chapterTitle,
        totalQuestions: publicQuestions.length,
        questions: publicQuestions,
      },
    });
  } catch (err) {
    console.error('Get exam attempt error:', err);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات آزمون.' },
      { status: 500 }
    );
  }
}
