'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  MinusCircle,
  RotateCcw,
  XCircle,
} from 'lucide-react';
import type { ExamResultPayload } from '@/lib/types';

interface ExamResultViewProps {
  result: ExamResultPayload;
  onRetake?: () => void;
}

type ReviewFilter = 'all' | 'wrong' | 'correct';
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function ExamResultView({ result, onRetake }: ExamResultViewProps) {
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const filteredReview = useMemo(() => {
    if (filter === 'correct') return result.review.filter((r) => r.isCorrect);
    if (filter === 'wrong') return result.review.filter((r) => !r.isCorrect);
    return result.review;
  }, [result.review, filter]);

  const passed = result.scorePercent >= 60;

  return (
    <div className="max-w-[960px] mx-auto px-6 py-12 md:py-16">
      {/* Breadcrumb */}
      <div className="mb-8 flex flex-wrap items-center gap-2 text-[13px] text-[#78716c]">
        <Link
          href={`/books/${result.bookId}`}
          className="inline-flex items-center gap-1.5 hover:text-[#0c0a09] transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          <span dir="ltr" className="font-latin">
            {result.bookTitle}
          </span>
        </Link>
        <span aria-hidden="true">/</span>
        <span dir="ltr" className="font-latin text-[#0c0a09]">
          {result.chapterTitle}
        </span>
      </div>

      {/* Summary Score Card */}
      <section className="rounded-[10px] bg-white border border-[#e8e6e5] p-6 md:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-[13px] text-[#78716c]">کارنامه نهایی آزمون</p>
            <h1 className="mt-2 text-[32px] font-normal leading-[1.25] tracking-[-0.02em] text-[#0c0a09]">
              نمره شما:{' '}
              <span
                dir="ltr"
                className="bg-[#c1e1f7] text-[#3398e1] px-2.5 py-0.5 rounded-[4px] font-mono tabular-nums inline-block"
              >
                {result.scorePercent}%
              </span>
            </h1>
            <p className="mt-2 text-[14px] text-[#78716c]">
              {passed
                ? 'عملکرد مطلوب — مفاهیم اصلی این فصل را به خوبی درک کرده‌اید.'
                : 'نیاز به مرور بیشتر — پاسخ‌های نادرست زیر را بررسی کنید و دوباره آزمون دهید.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {onRetake ? (
              <button
                type="button"
                onClick={onRetake}
                className="inline-flex items-center gap-2 rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-5 py-2 text-[14px] hover:bg-[#3398e1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
                <span>آزمون مجدد با سوالات تصادفی</span>
              </button>
            ) : (
              <Link
                href={`/exam/${result.chapterId}`}
                className="inline-flex items-center gap-2 rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-5 py-2 text-[14px] hover:bg-[#3398e1] transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
                <span>آزمون مجدد</span>
              </Link>
            )}

            <Link
              href={`/books/${result.bookId}`}
              className="rounded-full border border-[#e8e6e5] px-4 py-2 text-[14px] text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-[#fafaf9] transition-colors whitespace-nowrap shrink-0"
            >
              بازگشت به فصل‌ها
            </Link>
          </div>
        </div>

        {/* Clean Metrics Strip */}
        <div className="mt-8 pt-6 border-t border-[#e8e6e5] grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <p className="text-[12px] text-[#78716c]">تعداد کل سوالات</p>
            <p className="mt-1 text-[24px] font-normal text-[#0c0a09] font-mono tabular-nums">
              {result.totalQuestions}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-[#78716c]">پاسخ‌های صحیح</p>
            <p className="mt-1 text-[24px] font-normal text-[#3398e1] font-mono tabular-nums">
              {result.correctCount}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-[#78716c]">پاسخ‌های نادرست</p>
            <p className="mt-1 text-[24px] font-normal text-[#991b1b] font-mono tabular-nums">
              {result.wrongCount}
            </p>
          </div>
          <div>
            <p className="text-[12px] text-[#78716c]">بی‌پاسخ</p>
            <p className="mt-1 text-[24px] font-normal text-[#78716c] font-mono tabular-nums">
              {result.unansweredCount}
            </p>
          </div>
        </div>
      </section>

      {/* Detailed Question Breakdown */}
      <section className="mt-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e8e6e5]">
          <h2 className="text-[20px] font-normal text-[#0c0a09]">
            بررسی دقیق سوالات و پاسخ‌ها
          </h2>

          <div className="flex items-center gap-2" role="tablist" aria-label="فیلتر سوالات کارنامه">
            {(
              [
                { id: 'all', label: `همه (${result.review.length})` },
                {
                  id: 'wrong',
                  label: `نادرست (${result.wrongCount + result.unansweredCount})`,
                },
                { id: 'correct', label: `صحیح (${result.correctCount})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => setFilter(tab.id)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                  filter === tab.id
                    ? 'bg-[#1c1917] text-white font-medium'
                    : 'bg-transparent border border-[#e8e6e5] text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredReview.length === 0 ? (
          <div className="mt-6 rounded-[10px] bg-white border border-[#e8e6e5] p-8 text-center text-[14px] text-[#78716c]">
            سوالی در این دسته وجود ندارد.
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {filteredReview.map((item) => {
              const originalIndex =
                result.review.findIndex((r) => r.questionId === item.questionId) + 1;
              const isUnanswered = item.selectedIndex === null;

              return (
                <article
                  key={item.questionId}
                  className="rounded-[10px] bg-white border border-[#e8e6e5] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#e8e6e5]">
                    <span className="text-[13px] tabular-nums text-[#78716c]">
                      سوال{' '}
                      <span className="font-mono">
                        {String(originalIndex).padStart(2, '0')}
                      </span>
                    </span>

                    {item.isCorrect ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3398e1]">
                        <CheckCircle2 className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
                        <span>پاسخ صحیح</span>
                      </span>
                    ) : isUnanswered ? (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#78716c]">
                        <MinusCircle className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
                        <span>بی‌پاسخ</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#991b1b]">
                        <XCircle className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
                        <span>پاسخ نادرست</span>
                      </span>
                    )}
                  </div>

                  <h3
                    dir="auto"
                    className="mt-4 text-[16px] font-medium leading-[1.6] text-[#0c0a09] font-latin"
                  >
                    {item.question}
                  </h3>

                  <div className="mt-4 space-y-2.5">
                    {item.answers.map((answerText, optIdx) => {
                      const isCorrectOpt = optIdx === item.correctIndex;
                      const isSelectedOpt = optIdx === item.selectedIndex;

                      let rowClasses =
                        'border-[#e8e6e5] bg-[#fafaf9]/60 text-[#78716c]';
                      if (isCorrectOpt) {
                        rowClasses =
                          'border-[#3ba6f1] bg-[#c1e1f7]/30 text-[#0c0a09]';
                      } else if (isSelectedOpt && !isCorrectOpt) {
                        rowClasses =
                          'border-[#fca5a5] bg-[#fef2f2] text-[#991b1b]';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`rounded-[8px] border px-4 py-3 flex items-start justify-between gap-4 text-[14px] ${rowClasses}`}
                        >
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <span
                              dir="ltr"
                              className="font-mono text-[12px] mt-0.5 shrink-0 font-medium"
                            >
                              {OPTION_LABELS[optIdx]}.
                            </span>
                            <span
                              dir="auto"
                              className="font-latin leading-[1.55] flex-1 text-start"
                            >
                              {answerText}
                            </span>
                          </div>

                          <div className="shrink-0 text-[12px] font-medium whitespace-nowrap">
                            {isCorrectOpt && isSelectedOpt && (
                              <span className="text-[#3398e1]">انتخاب شما · صحیح</span>
                            )}
                            {isCorrectOpt && !isSelectedOpt && (
                              <span className="text-[#3398e1]">پاسخ صحیح</span>
                            )}
                            {!isCorrectOpt && isSelectedOpt && (
                              <span className="text-[#991b1b]">انتخاب شما (غلط)</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
