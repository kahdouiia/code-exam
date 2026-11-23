import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-server';
import { getDb } from '@/lib/db';
import { selectRandomQuestions } from '@/lib/quiz-engine';
import type { ExamAttempt, PublicQuestion } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { error: 'برای شرکت در آزمون ابتدا وارد حساب کاربری خود شوید.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const chapterId = typeof body.chapterId === 'string' ? body.chapterId.trim() : '';
    if (!chapterId) {
      return NextResponse.json({ error: 'شناسه فصل الزامی است.' }, { status: 400 });
    }

    const db = getDb();
    const chapter = await db.getChapterById(chapterId);
    if (!chapter) {
      return NextResponse.json({ error: 'فصل مورد نظر یافت نشد.' }, { status: 404 });
    }

    const book = await db.getBookWithChapters(chapter.bookId);
    if (!book) {
      return NextResponse.json({ error: 'کتاب مرتبط یافت نشد.' }, { status: 404 });
    }

    const bank = await db.listQuestionsByChapter(chapterId);
    if (bank.length === 0) {
      return NextResponse.json(
        { error: 'برای این فصل هنوز هیچ سوالی در بانک سوال ثبت نشده است.' },
        { status: 400 }
      );
    }

    const selected = selectRandomQuestions(bank, chapter.quizQuestionCount);
    const attempt: ExamAttempt = {
      id: `att_${crypto.randomUUID().slice(0, 12)}`,
      userId: session.sub,
      bookId: book.id,
      chapterId: chapter.id,
      bookTitle: book.title,
      chapterTitle: chapter.title,
      questionIds: selected.map((q) => q.id),
      questionsSnapshot: selected,
      submittedAnswers: {},
      totalQuestions: selected.length,
      correctCount: 0,
      wrongCount: 0,
      unansweredCount: selected.length,
      scorePercent: 0,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      completedAt: null,
    };

    await db.createExamAttempt(attempt);

    const publicQuestions: PublicQuestion[] = selected.map((q) => ({
      id: q.id,
      question: q.question,
      answers: q.answers,
    }));

    return NextResponse.json(
      {
        attemptId: attempt.id,
        bookId: book.id,
        chapterId: chapter.id,
        bookTitle: book.title,
        chapterTitle: chapter.title,
        configuredCount: chapter.quizQuestionCount,
        bankSize: bank.length,
        totalQuestions: publicQuestions.length,
        questions: publicQuestions,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('Start exam error:', err);
    return NextResponse.json(
      { error: 'خطا در شروع آزمون.' },
      { status: 500 }
    );
  }
}
