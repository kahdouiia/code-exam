'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardList, Loader2 } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface HistoryItem {
  id: string;
  bookId: string;
  chapterId: string;
  bookTitle: string;
  chapterTitle: string;
  totalQuestions: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  scorePercent: number;
  completedAt: string;
}

export function HistoryView() {
  const { user, loading: authLoading } = useAuth();
  const [attempts, setAttempts] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    fetch('/api/exams/history', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { attempts: [] }))
      .then((data) => {
        if (!cancelled) {
          setAttempts(Array.isArray(data.attempts) ? data.attempts : []);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading || (Boolean(user) && loading)) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-24 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#3ba6f1]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-[520px] mx-auto px-6 py-20 text-center">
        <div className="rounded-[10px] bg-white border border-[#e8e6e5] p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
          <h1 className="text-[24px] font-normal text-[#0c0a09]">
            سوابق آزمون‌های شما
          </h1>
          <p className="mt-2 text-[14px] text-[#78716c]">
            برای مشاهده تاریخچه آزمون‌ها و تحلیل پاسخ‌ها وارد حساب کاربری شوید.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/login?next=/history"
              className="rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-5 py-2 text-[14px] hover:bg-[#3398e1]"
            >
              ورود
            </Link>
            <Link
              href="/register"
              className="rounded-full border border-[#e8e6e5] px-5 py-2 text-[14px] text-[#0c0a09]"
            >
              ثبت‌نام
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const averageScore =
    attempts.length > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + a.scorePercent, 0) / attempts.length
        )
      : 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#e8e6e5]">
        <div>
          <h1 className="text-[32px] font-normal leading-[1.25] tracking-[-0.02em] text-[#0c0a09]">
            سوابق و{' '}
            <span className="bg-[#c1e1f7] text-[#3398e1] px-2 py-0.5 rounded-[4px]">
              کارنامه‌های
            </span>{' '}
            شما
          </h1>
          <p className="mt-2 text-[14px] text-[#78716c]">
            تمام آزمون‌های تکمیل‌شده شما همراه با امکان مرور سوالات درست و نادرست.
          </p>
        </div>

        {attempts.length > 0 && (
          <div className="text-[13px] text-[#78716c] tabular-nums flex items-center gap-3">
            <span>تعداد آزمون: {attempts.length}</span>
            <span aria-hidden="true">·</span>
            <span>میانگین نمره: {averageScore}%</span>
          </div>
        )}
      </div>

      {attempts.length === 0 ? (
        <div className="mt-8 rounded-[10px] bg-white border border-[#e8e6e5] p-12 text-center shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
          <ClipboardList className="w-7 h-7 text-[#a8a29e] mx-auto mb-3 stroke-[1.5]" />
          <p className="text-[16px] text-[#0c0a09]">
            هنوز هیچ آزمونی تکمیل نکرده‌اید.
          </p>
          <p className="mt-1 text-[14px] text-[#78716c]">
            یک کتاب و فصل از کتابخانه انتخاب کنید تا اولین آزمون خود را ثبت کنید.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-5 py-2 text-[14px] hover:bg-[#3398e1]"
          >
            <span>رفتن به کتابخانه</span>
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="mt-8 rounded-[10px] bg-white border border-[#e8e6e5] shadow-[0_4px_16px_rgba(0,0,0,0.05)] overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-[#e8e6e5] text-[12px] text-[#78716c]">
                <th className="py-3.5 px-6 font-medium">کتاب و فصل</th>
                <th className="py-3.5 px-4 font-medium">نمره</th>
                <th className="py-3.5 px-4 font-medium">صحیح / غلط</th>
                <th className="py-3.5 px-4 font-medium">تاریخ</th>
                <th className="py-3.5 px-6 font-medium text-left">جزئیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e6e5] text-[14px]">
              {attempts.map((item) => (
                <tr key={item.id} className="hover:bg-[#fafaf9] transition-colors">
                  <td className="py-4 px-6">
                    <div
                      dir="auto"
                      className="font-medium text-[#0c0a09] font-latin"
                    >
                      {item.bookTitle}
                    </div>
                    <div
                      dir="auto"
                      className="text-[13px] text-[#78716c] font-latin mt-0.5"
                    >
                      {item.chapterTitle}
                    </div>
                  </td>
                  <td className="py-4 px-4 font-mono tabular-nums font-medium text-[#0c0a09]">
                    <span dir="ltr" className="inline-block">
                      {item.scorePercent}%
                    </span>
                  </td>
                  <td className="py-4 px-4 tabular-nums text-[13px] text-[#78716c]">
                    <span className="text-[#3398e1]">
                      <span className="font-mono">{item.correctCount}</span> صحیح
                    </span>
                    {' · '}
                    <span className="text-[#991b1b]">
                      <span className="font-mono">
                        {item.wrongCount + item.unansweredCount}
                      </span>{' '}
                      غلط
                    </span>
                  </td>
                  <td className="py-4 px-4 text-[13px] text-[#78716c] tabular-nums whitespace-nowrap">
                    {new Intl.DateTimeFormat('fa-IR', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    }).format(new Date(item.completedAt))}
                  </td>
                  <td className="py-4 px-6 text-left whitespace-nowrap">
                    <Link
                      href={`/results/${item.id}`}
                      className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3398e1] hover:text-[#0c0a09]"
                    >
                      <span>مشاهده کارنامه</span>
                      <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
