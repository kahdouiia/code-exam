'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from 'lucide-react';
import type { ExamResultPayload, PublicQuestion } from '@/lib/types';
import { useAuth } from './AuthProvider';
import { ExamResultView } from './ExamResultView';

interface ExamRunnerProps {
  chapterId: string;
}

interface ActiveExamSession {
  attemptId: string;
  bookId: string;
  chapterId: string;
  bookTitle: string;
  chapterTitle: string;
  totalQuestions: number;
  bankSize: number;
  questions: PublicQuestion[];
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function ExamRunner({ chapterId }: ExamRunnerProps) {
  const { user, loading: authLoading } = useAuth();
  const [session, setSession] = useState<ActiveExamSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmUnanswered, setConfirmUnanswered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ExamResultPayload | null>(null);
  const startedRef = useRef(false);

  const startNewExam = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setConfirmUnanswered(false);
    setCurrentIndex(0);
    setAnswers({});

    try {
      const res = await fetch('/api/exams/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در شروع آزمون.');
        return;
      }
      setSession(data as ActiveExamSession);
    } catch {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setLoading(false);
    }
  }, [chapterId]);

  useEffect(() => {
    if (authLoading || !user || startedRef.current) return;
    startedRef.current = true;
    let active = true;
    fetch('/api/exams/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterId }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!active) return;
        if (!res.ok) {
          setError(data.error || 'خطا در شروع آزمون.');
          return;
        }
        setSession(data as ActiveExamSession);
      })
      .catch(() => {
        if (active) setError('خطا در برقراری ارتباط با سرور.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, user, chapterId]);

  const handleSelectOption = (questionId: string, optionIdx: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIdx }));
    setConfirmUnanswered(false);
  };

  const submitExam = async () => {
    if (!session) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/exams/${session.attemptId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در ثبت پاسخ‌ها.');
        return;
      }
      setResult(data.result as ExamResultPayload);
    } catch {
      setError('خطا در ارسال پاسخ‌ها به سرور.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    if (!session) return;
    const answeredCount = session.questions.filter(
      (q) => typeof answers[q.id] === 'number'
    ).length;
    if (answeredCount < session.totalQuestions && !confirmUnanswered) {
      setConfirmUnanswered(true);
      return;
    }
    submitExam();
  };

  if (authLoading || (Boolean(user) && loading)) {
    return (
      <div className="max-w-[820px] mx-auto px-6 py-24 flex flex-col items-center justify-center text-[#78716c]">
        <Loader2 className="w-6 h-6 animate-spin text-[#3ba6f1] mb-3" />
        <p className="text-[14px]">در حال انتخاب تصادفی سوالات آزمون...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-[540px] mx-auto px-6 py-20 text-center">
        <div className="rounded-[10px] bg-white border border-[#e8e6e5] p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
          <h1 className="text-[24px] font-normal text-[#0c0a09]">
            برای شرکت در آزمون وارد شوید
          </h1>
          <p className="mt-2 text-[14px] text-[#78716c]">
            نتیجه و تحلیل آزمون در حساب کاربری شما ذخیره می‌شود.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href={`/login?next=${encodeURIComponent(`/exam/${chapterId}`)}`}
              className="rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-5 py-2 text-[14px] hover:bg-[#3398e1]"
            >
              ورود به حساب
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-[#e8e6e5] px-5 py-2 text-[14px] text-[#0c0a09] hover:bg-[#fafaf9]"
            >
              ثبت‌نام
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (result) {
    return <ExamResultView result={result} onRetake={startNewExam} />;
  }

  if (error || !session) {
    return (
      <div className="max-w-[560px] mx-auto px-6 py-20">
        <div className="rounded-[10px] bg-white border border-[#e8e6e5] p-8 text-center">
          <AlertCircle className="w-6 h-6 text-[#991b1b] mx-auto mb-3" />
          <p className="text-[15px] text-[#0c0a09]">
            {error || 'امکان شروع آزمون وجود ندارد.'}
          </p>
          <Link
            href="/"
            className="mt-5 inline-flex rounded-full border border-[#e8e6e5] px-5 py-2 text-[14px] text-[#0c0a09] hover:bg-[#fafaf9]"
          >
            بازگشت به کتابخانه
          </Link>
        </div>
      </div>
    );
  }

  const currentQuestion = session.questions[currentIndex];
  const selectedForCurrent = answers[currentQuestion.id] ?? null;
  const answeredCount = session.questions.filter(
    (q) => typeof answers[q.id] === 'number'
  ).length;
  const progressPercent = Math.round(
    ((currentIndex + 1) / session.totalQuestions) * 100
  );

  return (
    <div className="max-w-[820px] mx-auto px-6 py-12 md:py-16">
      {/* Header & Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <p dir="ltr" className="text-[12px] text-[#78716c] font-latin text-right truncate">
            {session.bookTitle} · {session.chapterTitle}
          </p>
          <h1 className="mt-1 text-[22px] font-normal text-[#0c0a09]">
            آزمون فصل
          </h1>
        </div>
        <div className="text-[13px] text-[#78716c] tabular-nums flex items-center gap-3 shrink-0">
          <span>
            سوال <span className="font-mono">{currentIndex + 1}</span> از{' '}
            <span className="font-mono">{session.totalQuestions}</span>
          </span>
          <span aria-hidden="true">·</span>
          <span>
            پاسخ‌داده‌شده: <span className="font-mono">{answeredCount}</span>
          </span>
        </div>
      </div>

      {/* Hairline progress bar */}
      <div className="mt-4 h-1 w-full bg-[#e8e6e5] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#3ba6f1] transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question Card */}
      <section className="mt-8 rounded-[10px] bg-white border border-[#e8e6e5] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
        <div className="text-[12px] text-[#78716c] tabular-nums mb-3">
          سوال <span className="font-mono">{String(currentIndex + 1).padStart(2, '0')}</span>
        </div>

        <h2
          dir="auto"
          className="text-[19px] sm:text-[21px] font-normal leading-[1.55] text-[#0c0a09] font-latin"
        >
          {currentQuestion.question}
        </h2>

        <div className="mt-7 space-y-3" role="radiogroup" aria-label="گزینه‌های سوال">
          {currentQuestion.answers.map((optText, idx) => {
            const isSelected = selectedForCurrent === idx;
            return (
              <button
                key={idx}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleSelectOption(currentQuestion.id, idx)}
                className={`w-full text-right rounded-[8px] border px-4 py-3.5 flex items-start gap-3.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ba6f1] ${
                  isSelected
                    ? 'border-[#3ba6f1] bg-[#c1e1f7]/25 text-[#0c0a09]'
                    : 'border-[#e8e6e5] bg-white text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-[#fafaf9]'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full border text-[12px] font-mono flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'border-[#3398e1] bg-[#3ba6f1] text-white'
                      : 'border-[#d6d3d1] text-[#78716c]'
                  }`}
                >
                  {isSelected ? (
                    <Check className="w-3.5 h-3.5 stroke-[2.2]" aria-hidden="true" />
                  ) : (
                    OPTION_LABELS[idx]
                  )}
                </span>
                <span
                  dir="auto"
                  className="text-[15px] leading-[1.6] font-latin flex-1 text-start"
                >
                  {optText}
                </span>
              </button>
            );
          })}
        </div>

        {/* Unanswered warning inline */}
        {confirmUnanswered && (
          <div
            role="alert"
            className="mt-6 rounded-[8px] border border-[#e8e6e5] bg-[#fafaf9] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]"
          >
            <span className="text-[#0c0a09]">
              شما به {session.totalQuestions - answeredCount} سوال هنوز پاسخ نداده‌اید.
              آیا از ثبت نهایی آزمون مطمئن هستید؟
            </span>
            <button
              type="button"
              onClick={submitExam}
              disabled={submitting}
              className="rounded-full bg-[#1c1917] text-white px-4 py-1.5 text-[13px] font-medium whitespace-nowrap shrink-0 cursor-pointer"
            >
              بله، ثبت نهایی شود
            </button>
          </div>
        )}

        {/* Navigation footer */}
        <div className="mt-8 pt-6 border-t border-[#e8e6e5] flex items-center justify-between gap-4">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e6e5] px-4 py-2 text-[14px] text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-[#fafaf9] disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ArrowRight className="w-4 h-4 stroke-[1.5]" aria-hidden="true" />
            <span>سوال قبلی</span>
          </button>

          {currentIndex < session.totalQuestions - 1 ? (
            <button
              type="button"
              onClick={() =>
                setCurrentIndex((i) => Math.min(session.totalQuestions - 1, i + 1))
              }
              className="inline-flex items-center gap-1.5 rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-5 py-2 text-[14px] hover:bg-[#3398e1] transition-colors cursor-pointer"
            >
              <span>سوال بعدی</span>
              <ArrowLeft className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled={submitting}
              onClick={handleSubmitClick}
              className="inline-flex items-center gap-2 rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-6 py-2 text-[14px] hover:bg-[#3398e1] transition-colors disabled:opacity-60 cursor-pointer"
            >
              <span>{submitting ? 'در حال تصحیح...' : 'پایان و ثبت آزمون'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Question Number Stepper */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {session.questions.map((q, idx) => {
            const answered = typeof answers[q.id] === 'number';
            const active = idx === currentIndex;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`رفتن به سوال ${idx + 1}`}
                className={`w-9 h-9 rounded-full text-[13px] font-mono tabular-nums transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1c1917] text-white font-medium'
                    : answered
                      ? 'bg-[#c1e1f7]/60 text-[#3398e1] border border-[#3ba6f1]/40'
                      : 'bg-white border border-[#e8e6e5] text-[#78716c] hover:border-[#d6d3d1]'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={handleSubmitClick}
          className="text-[13px] text-[#78716c] hover:text-[#0c0a09] underline underline-offset-4 cursor-pointer"
        >
          ثبت زودهنگام و مشاهده کارنامه
        </button>
      </div>
    </div>
  );
}
