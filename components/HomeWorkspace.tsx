'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  FileJson,
  Layers,
  Search,
  Shuffle,
  XCircle,
} from 'lucide-react';
import type { BookWithChapters } from '@/lib/types';
import { useAuth } from './AuthProvider';

interface HomeWorkspaceProps {
  initialBooks: BookWithChapters[];
}

type PreviewTab = 'library' | 'exam' | 'report';

export function HomeWorkspace({ initialBooks }: HomeWorkspaceProps) {
  const { user } = useAuth();
  const [books] = useState<BookWithChapters[]>(initialBooks);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [previewTab, setPreviewTab] = useState<PreviewTab>('library');

  const topics = useMemo(() => {
    const set = new Set<string>();
    books.forEach((b) => {
      if (b.topic) set.add(b.topic);
    });
    return Array.from(set);
  }, [books]);

  const filteredBooks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return books.filter((b) => {
      if (selectedTopic !== 'all' && b.topic !== selectedTopic) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.topic.toLowerCase().includes(q)
      );
    });
  }, [books, searchQuery, selectedTopic]);

  const totalChapters = useMemo(
    () => books.reduce((sum, b) => sum + b.chapters.length, 0),
    [books]
  );
  const totalQuestions = useMemo(
    () => books.reduce((sum, b) => sum + b.totalQuestions, 0),
    [books]
  );

  return (
    <div className="max-w-[1200px] mx-auto px-6">
      {/* Hero Section — Quiet Analyst's Desk on Warm Paper */}
      <section className="pt-14 pb-12 md:pt-20 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[780px]"
        >
          <h1 className="text-[36px] sm:text-[46px] lg:text-[52px] font-normal leading-[1.18] tracking-[-0.02em] text-[#0c0a09] text-balance">
            ارزیابی عمیق و{' '}
            <span className="bg-[#c1e1f7] text-[#3398e1] px-2.5 py-0.5 rounded-[4px] inline-block">
              ساده و هدفمند
            </span>{' '}
            برای کتاب‌های مهندسی نرم‌افزار
          </h1>

          <p className="mt-5 text-[16px] font-normal leading-[1.69] text-[#78716c] max-w-[640px]">
            کتاب مورد نظرتان را انتخاب کنید، وارد هر فصل شوید و با آزمون‌های چهارگزینه‌ای
            تصادفی، درک واقعی خود را از مفاهیم طراحی نرم‌افزار، بازآرایی و معماری بسنجید.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#library"
              className="inline-flex items-center gap-2 rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-5 py-2.5 text-[14px] hover:bg-[#3398e1] transition-colors whitespace-nowrap shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
            >
              <span>انتخاب کتاب و شروع آزمون</span>
              <ArrowLeft className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
            </a>

            {user?.role === 'admin' ? (
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-full bg-transparent border border-[#e8e6e5] text-[#0c0a09] font-normal px-5 py-2.5 text-[14px] hover:border-[#d6d3d1] hover:bg-white transition-colors whitespace-nowrap shrink-0"
              >
                <span>ورود به پنل ادمین</span>
              </Link>
            ) : (
              <Link
                href={user ? '/history' : '/login'}
                className="inline-flex items-center gap-2 rounded-full bg-transparent border border-[#e8e6e5] text-[#0c0a09] font-normal px-5 py-2.5 text-[14px] hover:border-[#d6d3d1] hover:bg-white transition-colors whitespace-nowrap shrink-0"
              >
                <span>{user ? 'مشاهده کارنامه‌های من' : 'ورود به حساب کاربری'}</span>
              </Link>
            )}
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-3 text-[13px] text-[#78716c] tabular-nums">
            <span>{books.length} کتاب تخصصی</span>
            <span aria-hidden="true">·</span>
            <span>{totalChapters} فصل ساختاریافته</span>
            <span aria-hidden="true">·</span>
            <span>{totalQuestions} سوال در بانک آزمون</span>
          </div>
        </motion.div>

        {/* Floating Product Preview Card (Seline signature elevation) */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12"
        >
          <div className="rounded-[16px] bg-white border border-[#e8e6e5] p-2 shadow-[0_12px_45px_rgba(17,12,46,0.12)]">
            <div className="rounded-[12px] border border-[#e8e6e5] bg-[#fafaf9] p-6 md:p-8">
              {previewTab === 'library' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between border-b border-[#e8e6e5] pb-3">
                      <span className="text-[14px] font-medium text-[#0c0a09]">
                        فهرست کتاب‌های فعال
                      </span>
                      <span className="text-[12px] text-[#78716c] tabular-nums">
                        {books.length} عنوان
                      </span>
                    </div>
                    <div className="divide-y divide-[#e8e6e5]">
                      {books.slice(0, 3).map((b, idx) => (
                        <div
                          key={b.id}
                          className="py-3 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0">
                            <p
                              dir="ltr"
                              className="text-[14px] font-medium text-[#0c0a09] truncate text-right font-latin"
                            >
                              {String(idx + 1).padStart(2, '0')}. {b.title}
                            </p>
                            <p className="text-[12px] text-[#78716c] mt-0.5">
                              {b.author} · {b.chapters.length} فصل
                            </p>
                          </div>
                          <span className="text-[12px] tabular-nums text-[#78716c] shrink-0">
                            <span className="font-mono">{b.totalQuestions}</span> سوال
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="border-t md:border-t-0 md:border-r border-[#e8e6e5] pt-4 md:pt-0 md:pr-6 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <BookOpen className="w-5 h-5 text-[#0c0a09] stroke-[1.5]" />
                      <h3 className="text-[16px] font-medium text-[#0c0a09]">
                        سازمان‌دهی دقیق فصل‌ها
                      </h3>
                      <p className="text-[13px] leading-[1.64] text-[#78716c]">
                        ادمین کتاب‌ها و ترتیب فصل‌ها را تعریف می‌کند، فایل JSON سوالات را
                        آپلود می‌نماید و تعداد سوالات تصادفی هر آزمون را مشخص می‌کند.
                      </p>
                    </div>
                    <div className="text-[12px] text-[#78716c] flex items-center gap-2 pt-3 border-t border-[#e8e6e5]">
                      <FileJson className="w-4 h-4 text-[#3ba6f1] stroke-[1.5]" />
                      <span>پشتیبانی کامل از ایمپورت JSON چهارگزینه‌ای</span>
                    </div>
                  </div>
                </div>
              )}

              {previewTab === 'exam' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between text-[12px] text-[#78716c]">
                      <span dir="ltr" className="font-latin">
                        A Philosophy of Software Design · Chapter 4
                      </span>
                      <span className="tabular-nums">
                        سوال <span className="font-mono">2</span> از{' '}
                        <span className="font-mono">4</span>
                      </span>
                    </div>
                    <p
                      dir="ltr"
                      className="text-[15px] text-[#0c0a09] leading-[1.6] font-latin text-left"
                    >
                      How does John Ousterhout define a &ldquo;deep module&rdquo;?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" dir="ltr">
                      <div className="rounded-[8px] border border-[#3ba6f1] bg-[#c1e1f7]/30 px-3.5 py-2.5 text-[13px] text-[#0c0a09] text-left">
                        A. Powerful functionality behind a simple interface
                      </div>
                      <div className="rounded-[8px] border border-[#e8e6e5] bg-white px-3.5 py-2.5 text-[13px] text-[#78716c] text-left">
                        B. Many small getter and setter classes
                      </div>
                      <div className="rounded-[8px] border border-[#e8e6e5] bg-white px-3.5 py-2.5 text-[13px] text-[#78716c] text-left">
                        C. Five or more inheritance levels
                      </div>
                      <div className="rounded-[8px] border border-[#e8e6e5] bg-white px-3.5 py-2.5 text-[13px] text-[#78716c] text-left">
                        D. Exposing internal state to callers
                      </div>
                    </div>
                  </div>
                  <div className="border-t md:border-t-0 md:border-r border-[#e8e6e5] pt-4 md:pt-0 md:pr-6 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <Shuffle className="w-5 h-5 text-[#0c0a09] stroke-[1.5]" />
                      <h3 className="text-[16px] font-medium text-[#0c0a09]">
                        انتخاب تصادفی در هر نوبت
                      </h3>
                      <p className="text-[13px] leading-[1.64] text-[#78716c]">
                        در هر بار شروع آزمون، به تعداد تعیین‌شده توسط ادمین از بانک
                        سوالات فصل به‌صورت تصادفی و بدون تکرار انتخاب می‌شود.
                      </p>
                    </div>
                    <div className="text-[12px] text-[#78716c] pt-3 border-t border-[#e8e6e5]">
                      تصحیح سمت سرور بدون افشای کلید پاسخ‌ها
                    </div>
                  </div>
                </div>
              )}

              {previewTab === 'report' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-baseline justify-between border-b border-[#e8e6e5] pb-3">
                      <span className="text-[14px] font-medium text-[#0c0a09]">
                        خلاصه نتیجه آزمون
                      </span>
                      <span className="text-[28px] font-normal text-[#0c0a09] font-mono tabular-nums">
                        75%
                      </span>
                    </div>
                    <div className="space-y-2.5 text-[13px]">
                      <div className="flex items-center justify-between py-2 border-b border-[#e8e6e5]">
                        <span className="flex items-center gap-2 text-[#0c0a09]">
                          <CheckCircle2 className="w-4 h-4 text-[#3398e1] stroke-[1.75]" />
                          <span>سوال ۱ — The Nature of Complexity</span>
                        </span>
                        <span className="text-[#3398e1] font-medium">پاسخ صحیح</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="flex items-center gap-2 text-[#0c0a09]">
                          <XCircle className="w-4 h-4 text-[#991b1b] stroke-[1.75]" />
                          <span>سوال ۲ — Temporal Decomposition</span>
                        </span>
                        <span className="text-[#991b1b] font-medium">پاسخ نادرست</span>
                      </div>
                    </div>
                  </div>
                  <div className="border-t md:border-t-0 md:border-r border-[#e8e6e5] pt-4 md:pt-0 md:pr-6 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <Layers className="w-5 h-5 text-[#0c0a09] stroke-[1.5]" />
                      <h3 className="text-[16px] font-medium text-[#0c0a09]">
                        تفکیک دقیق پاسخ‌های درست و غلط
                      </h3>
                      <p className="text-[13px] leading-[1.64] text-[#78716c]">
                        بلافاصله پس از ثبت آزمون، نمره نهایی و تحلیل تک‌تک سوالات شامل
                        پاسخ انتخابی شما و گزینه صحیح نمایش داده می‌شود.
                      </p>
                    </div>
                    <div className="text-[12px] text-[#78716c] pt-3 border-t border-[#e8e6e5]">
                      ذخیره دائمی تمام کارنامه‌ها در حساب کاربری
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Seline Tab Pill Group under floating preview */}
          <div
            className="mt-5 flex flex-wrap items-center justify-center gap-2"
            role="tablist"
            aria-label="پیش‌نمایش قابلیت‌ها"
          >
            {(
              [
                { id: 'library', label: 'کتابخانه و فصل‌ها' },
                { id: 'exam', label: 'آزمون تصادفی' },
                { id: 'report', label: 'کارنامه و تحلیل' },
              ] as const
            ).map((tab) => {
              const active = previewTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPreviewTab(tab.id)}
                  className={`rounded-full px-4 py-1.5 text-[13px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'bg-[#1c1917] text-white font-medium'
                      : 'bg-transparent border border-[#e8e6e5] text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Book Library Section */}
      <section id="library" className="pt-12 pb-8 border-t border-[#e8e6e5]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h2 className="text-[28px] md:text-[32px] font-normal leading-[1.25] tracking-[-0.02em] text-[#0c0a09]">
              کتابخانه{' '}
              <span className="bg-[#c1e1f7] text-[#3398e1] px-2 py-0.5 rounded-[4px]">
                مهندسی نرم‌افزار
              </span>
            </h2>
            <p className="mt-2 text-[14px] leading-[1.64] text-[#78716c]">
              یک کتاب را انتخاب کنید تا فصل‌های آن و آزمون‌های هر فصل را مشاهده کنید.
            </p>
          </div>

          {/* Search input */}
          <div className="relative w-full md:w-[300px]">
            <label htmlFor="book-search" className="sr-only">
              جستجوی کتاب یا نویسنده
            </label>
            <Search
              className="w-4 h-4 text-[#a8a29e] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="book-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی کتاب یا نویسنده..."
              className="w-full bg-white rounded-[6px] border border-[#d6d3d1] pr-9 pl-3 py-2 text-[14px] text-[#0c0a09] placeholder:text-[#78716c] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1] focus:border-[#3ba6f1]"
            />
          </div>
        </div>

        {/* Topic Filter Controls */}
        {topics.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedTopic('all')}
              className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedTopic === 'all'
                  ? 'bg-[#1c1917] text-white font-medium'
                  : 'bg-transparent border border-[#e8e6e5] text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-white'
              }`}
            >
              همه موضوعات
            </button>
            {topics.map((topic) => (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`rounded-full px-3.5 py-1.5 text-[13px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedTopic === topic
                    ? 'bg-[#1c1917] text-white font-medium'
                    : 'bg-transparent border border-[#e8e6e5] text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-white'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        )}

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="mt-8 rounded-[10px] bg-white border border-[#e8e6e5] p-10 text-center">
            <p className="text-[15px] text-[#0c0a09]">
              کتابی مطابق با جستجوی شما پیدا نشد.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedTopic('all');
              }}
              className="mt-4 rounded-full border border-[#e8e6e5] px-4 py-1.5 text-[13px] text-[#0c0a09] hover:border-[#d6d3d1] cursor-pointer"
            >
              نمایش همه کتاب‌ها
            </button>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBooks.map((book) => (
              <article
                key={book.id}
                className="rounded-[10px] bg-white border border-[#e8e6e5] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)] flex flex-col justify-between transition-colors hover:border-[#d6d3d1]"
              >
                <div>
                  <div className="text-[12px] text-[#78716c] flex items-center gap-2">
                    <span>{book.topic}</span>
                    <span aria-hidden="true">·</span>
                    <span dir="ltr" className="font-latin">
                      {book.author}
                    </span>
                  </div>

                  <h3
                    dir="auto"
                    className="mt-3 text-[20px] font-medium leading-[1.3] text-[#0c0a09] font-latin"
                  >
                    {book.title}
                  </h3>

                  <p className="mt-3 text-[14px] leading-[1.64] text-[#78716c]">
                    {book.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#e8e6e5] flex items-center justify-between gap-4">
                  <div className="text-[13px] text-[#78716c] tabular-nums flex items-center gap-2">
                    <span>{book.chapters.length} فصل</span>
                    <span aria-hidden="true">·</span>
                    <span>{book.totalQuestions} سوال</span>
                  </div>

                  <Link
                    href={`/books/${book.id}`}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#3398e1] hover:text-[#0c0a09] transition-colors whitespace-nowrap shrink-0"
                  >
                    <span>مشاهده فصل‌ها</span>
                    <ArrowLeft className="w-3.5 h-3.5 stroke-[1.75]" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
