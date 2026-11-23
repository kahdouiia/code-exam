import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';
import { gradeExam } from '@/lib/quiz-engine';
import { ExamResultView } from '@/components/ExamResultView';
import type { ExamResultPayload } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default async function ExamResultPage({ params }: PageProps) {
  const { attemptId } = await params;
  const session = await getSessionUser();
  if (!session) {
    redirect(`/login?next=/results/${attemptId}`);
  }

  const db = getDb();
  const attempt = await db.getExamAttemptById(attemptId);
  if (!attempt) {
    notFound();
  }

  if (attempt.userId !== session.sub && session.role !== 'admin') {
    return (
      <div className="max-w-[540px] mx-auto px-6 py-20 text-center">
        <div className="rounded-[10px] bg-white border border-[#e8e6e5] p-8">
          <p className="text-[15px] text-[#0c0a09]">
            شما دسترسی مشاهده این کارنامه را ندارید.
          </p>
          <Link
            href="/history"
            className="mt-4 inline-flex rounded-full border border-[#e8e6e5] px-5 py-2 text-[14px]"
          >
            بازگشت به سوابق آزمون
          </Link>
        </div>
      </div>
    );
  }

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

  return <ExamResultView result={result} />;
}
