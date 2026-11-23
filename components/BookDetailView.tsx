'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, BookOpen, Play } from 'lucide-react';
import type { BookWithChapters } from '@/lib/types';
import { useAuth } from './AuthProvider';

interface BookDetailViewProps {
  book: BookWithChapters;
}

export function BookDetailView({ book }: BookDetailViewProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleStartExam = (chapterId: string) => {
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/exam/${chapterId}`)}`);
      return;
    }
    router.push(`/exam/${chapterId}`);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
      {/* Breadcrumb */}
      <div className="mb-8 flex items-center gap-2 text-[13px] text-[#78716c]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 hover:text-[#0c0a09] transition-colors"
        >
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
          <span>کتابخانه</span>
        </Link>
        <span aria-hidden="true">/</span>
        <span dir="ltr" className="text-[#0c0a09] font-latin truncate">
          {book.title}
        </span>
      </div>

      {/* Book Header */}
      <div className="max-w-[820px]">
        <div className="text-[13px] text-[#78716c] flex flex-wrap items-center gap-2">
          <span>{book.topic}</span>
          <span aria-hidden="true">·</span>
          <span dir="ltr" className="font-latin">
            {book.author}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{book.chapters.length} فصل</span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{book.totalQuestions} سوال در بانک</span>
        </div>

        <h1
          dir="auto"
          className="mt-3 text-[32px] md:text-[42px] font-normal leading-[1.2] tracking-[-0.02em] text-[#0c0a09] font-latin"
        >
          {book.title}
        </h1>

        <p className="mt-4 text-[16px] leading-[1.69] text-[#78716c]">
          {book.description}
        </p>
      </div>

      {/* Chapters List */}
      <section className="mt-12">
        <div className="flex items-center justify-between border-b border-[#e8e6e5] pb-4">
          <h2 className="text-[20px] font-normal text-[#0c0a09]">
            فصل‌های کتاب و انتخاب آزمون
          </h2>
          {!user && (
            <Link
              href={`/login?next=/books/${book.id}`}
              className="text-[13px] text-[#3398e1] hover:text-[#0c0a09]"
            >
              برای ثبت نمره وارد شوید
            </Link>
          )}
        </div>

        {book.chapters.length === 0 ? (
          <div className="mt-6 rounded-[10px] bg-white border border-[#e8e6e5] p-10 text-center">
            <BookOpen className="w-6 h-6 text-[#a8a29e] mx-auto mb-3 stroke-[1.5]" />
            <p className="text-[15px] text-[#0c0a09]">
              هنوز فصلی برای این کتاب تعریف نشده است.
            </p>
            {user?.role === 'admin' && (
              <Link
                href="/admin"
                className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-[#3398e1] hover:text-[#0c0a09]"
              >
                <span>افزودن فصل در پنل ادمین</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {book.chapters.map((chapter, idx) => {
              const hasQuestions = chapter.totalQuestions > 0;
              const effectiveExamCount = Math.min(
                chapter.quizQuestionCount,
                chapter.totalQuestions
              );

              return (
                <div
                  key={chapter.id}
                  className="rounded-[10px] bg-white border border-[#e8e6e5] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)] flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#78716c] tabular-nums">
                      <span className="font-mono text-[#0c0a09] font-medium">
                        {String(idx + 1).padStart(2, '0')}.
                      </span>
                      <span>بانک سوال: {chapter.totalQuestions}</span>
                      <span aria-hidden="true">·</span>
                      <span>تعداد سوال آزمون: {effectiveExamCount || chapter.quizQuestionCount}</span>
                      {chapter.bestScore !== null &&
                        chapter.bestScore !== undefined && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-[#3398e1] font-medium">
                              بهترین نمره شما: {chapter.bestScore}%
                            </span>
                          </>
                        )}
                    </div>

                    <h3
                      dir="auto"
                      className="text-[18px] font-medium text-[#0c0a09] font-latin"
                    >
                      {chapter.title}
                    </h3>

                    {chapter.description && (
                      <p className="text-[14px] leading-[1.64] text-[#78716c] max-w-[680px]">
                        {chapter.description}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-3">
                    <button
                      type="button"
                      disabled={!hasQuestions}
                      onClick={() => handleStartExam(chapter.id)}
                      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-[14px] whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        hasQuestions
                          ? 'bg-[#3ba6f1] border border-[#3398e1] text-white font-medium hover:bg-[#3398e1]'
                          : 'bg-[#fafaf9] border border-[#e8e6e5] text-[#a8a29e] cursor-not-allowed'
                      }`}
                    >
                      <Play className="w-3.5 h-3.5 stroke-[1.75]" aria-hidden="true" />
                      <span>
                        {hasQuestions ? 'شروع آزمون فصل' : 'بدون سوال'}
                      </span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
