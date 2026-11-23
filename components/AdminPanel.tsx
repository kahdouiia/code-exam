'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BookPlus,
  Check,
  FileJson,
  Layers,
  Loader2,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import type { BookWithChapters } from '@/lib/types';
import { useAuth } from './AuthProvider';
import { AdminJsonUploader } from './AdminJsonUploader';

type WorkspaceTab = 'chapters' | 'questions';

export function AdminPanel() {
  const { user, loading: authLoading } = useAuth();
  const [books, setBooks] = useState<BookWithChapters[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('chapters');
  const [error, setError] = useState<string | null>(null);

  // Create Book Form
  const [showNewBookForm, setShowNewBookForm] = useState(false);
  const [bookTitle, setBookTitle] = useState('');
  const [bookAuthor, setBookAuthor] = useState('');
  const [bookTopic, setBookTopic] = useState('معماری و طراحی نرم‌افزار');
  const [bookDesc, setBookDesc] = useState('');
  const [savingBook, setSavingBook] = useState(false);

  // Create Chapter Form
  const [chapterTitle, setChapterTitle] = useState('');
  const [chapterDesc, setChapterDesc] = useState('');
  const [chapterQuizCount, setChapterQuizCount] = useState(5);
  const [savingChapter, setSavingChapter] = useState(false);

  // Inline quiz count edits per chapter
  const [editingCounts, setEditingCounts] = useState<Record<string, number>>({});
  const [savedCountId, setSavedCountId] = useState<string | null>(null);

  const fetchBooks = useCallback(async () => {
    try {
      const res = await fetch('/api/books', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data.books)
          ? (data.books as BookWithChapters[])
          : [];
        setBooks(list);
        setSelectedBookId((prev) =>
          prev && list.some((b) => b.id === prev) ? prev : list[0]?.id ?? null
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || user?.role !== 'admin') return;
    let active = true;
    fetch('/api/books', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { books: [] }))
      .then((data) => {
        if (!active) return;
        const list = Array.isArray(data.books)
          ? (data.books as BookWithChapters[])
          : [];
        setBooks(list);
        setSelectedBookId((prev) =>
          prev && list.some((b) => b.id === prev) ? prev : list[0]?.id ?? null
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authLoading, user?.role]);

  const selectedBook = books.find((b) => b.id === selectedBookId) ?? null;

  const selectedChapter =
    selectedBook?.chapters.find((c) => c.id === selectedChapterId) ??
    selectedBook?.chapters[0] ??
    null;

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (bookTitle.trim().length < 2 || bookAuthor.trim().length < 2) {
      setError('عنوان کتاب و نام نویسنده هر دو الزامی هستند.');
      return;
    }
    setSavingBook(true);
    try {
      const res = await fetch('/api/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: bookTitle,
          author: bookAuthor,
          topic: bookTopic,
          description: bookDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در ثبت کتاب.');
        return;
      }
      setBookTitle('');
      setBookAuthor('');
      setBookDesc('');
      setShowNewBookForm(false);
      await fetchBooks();
      if (data.book?.id) {
        setSelectedBookId(data.book.id);
      }
    } finally {
      setSavingBook(false);
    }
  };

  const handleDeleteBook = async (bookId: string) => {
    setError(null);
    const res = await fetch(`/api/books/${bookId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchBooks();
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;
    setError(null);
    if (chapterTitle.trim().length < 2) {
      setError('عنوان فصل باید حداقل ۲ کاراکتر باشد.');
      return;
    }
    if (!Number.isFinite(chapterQuizCount) || chapterQuizCount < 1) {
      setError('تعداد سوالات تصادفی آزمون باید حداقل ۱ باشد.');
      return;
    }

    setSavingChapter(true);
    try {
      const res = await fetch(`/api/books/${selectedBook.id}/chapters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: chapterTitle,
          description: chapterDesc,
          quizQuestionCount: chapterQuizCount,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'خطا در ایجاد فصل.');
        return;
      }
      setChapterTitle('');
      setChapterDesc('');
      setChapterQuizCount(5);
      await fetchBooks();
      if (data.chapter?.id) {
        setSelectedChapterId(data.chapter.id);
      }
    } finally {
      setSavingChapter(false);
    }
  };

  const handleSaveChapterQuizCount = async (chapterId: string, count: number) => {
    if (!Number.isFinite(count) || count < 1) return;
    const res = await fetch(`/api/chapters/${chapterId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quizQuestionCount: Math.floor(count) }),
    });
    if (res.ok) {
      setSavedCountId(chapterId);
      setTimeout(() => setSavedCountId(null), 1800);
      await fetchBooks();
    }
  };

  const handleMoveChapter = async (index: number, direction: -1 | 1) => {
    if (!selectedBook) return;
    const list = [...selectedBook.chapters];
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const tmp = list[index];
    list[index] = list[target];
    list[target] = tmp;

    const orderedChapterIds = list.map((c) => c.id);
    const res = await fetch(`/api/books/${selectedBook.id}/chapters`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderedChapterIds }),
    });
    if (res.ok) {
      await fetchBooks();
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    const res = await fetch(`/api/chapters/${chapterId}`, { method: 'DELETE' });
    if (res.ok) {
      await fetchBooks();
    }
  };

  if (authLoading || (user?.role === 'admin' && loading)) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-24 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-[#3ba6f1]" />
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-[540px] mx-auto px-6 py-20 text-center">
        <div className="rounded-[10px] bg-white border border-[#e8e6e5] p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
          <ShieldAlert className="w-7 h-7 text-[#0c0a09] mx-auto mb-3 stroke-[1.5]" />
          <h1 className="text-[24px] font-normal text-[#0c0a09]">
            دسترسی محدود به مدیر سیستم
          </h1>
          <p className="mt-2 text-[14px] text-[#78716c]">
            برای تعریف کتاب‌ها، چیدمان فصل‌ها و آپلود فایل JSON سوالات، لطفاً با
            حساب ادمین وارد شوید.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/login?next=/admin"
              className="rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-5 py-2 text-[14px] hover:bg-[#3398e1]"
            >
              ورود با حساب ادمین
            </Link>
            <Link
              href="/"
              className="rounded-full border border-[#e8e6e5] px-5 py-2 text-[14px] text-[#0c0a09]"
            >
              بازگشت به کتابخانه
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12 md:py-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#e8e6e5]">
        <div>
          <h1 className="text-[32px] font-normal leading-[1.25] tracking-[-0.02em] text-[#0c0a09]">
            پنل مدیریت{' '}
            <span className="bg-[#c1e1f7] text-[#3398e1] px-2 py-0.5 rounded-[4px]">
              کتاب‌ها و آزمون‌ها
            </span>
          </h1>
          <p className="mt-2 text-[14px] text-[#78716c]">
            کتاب‌های مهندسی نرم‌افزار را تعریف کنید، فصل‌ها را بچینید، تعداد سوالات
            آزمون را تنظیم کنید و بانک سوال JSON را آپلود نمایید.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowNewBookForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-4 py-2 text-[14px] hover:bg-[#3398e1] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <BookPlus className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
          <span>{showNewBookForm ? 'بستن فرم کتاب جدید' : 'افزودن کتاب جدید'}</span>
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mt-6 flex items-center gap-2 rounded-[8px] border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-[13px] text-[#991b1b]"
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* New Book Collapsible Form */}
      {showNewBookForm && (
        <form
          onSubmit={handleCreateBook}
          className="mt-6 rounded-[10px] bg-white border border-[#e8e6e5] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)] space-y-4"
        >
          <h2 className="text-[18px] font-medium text-[#0c0a09]">
            تعریف کتاب جدید
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="new-book-title"
                className="block text-[13px] font-medium text-[#0c0a09] mb-1.5"
              >
                عنوان کتاب
              </label>
              <input
                id="new-book-title"
                type="text"
                value={bookTitle}
                onChange={(e) => setBookTitle(e.target.value)}
                placeholder="مثلاً Clean Architecture"
                className="w-full bg-white rounded-[6px] border border-[#d6d3d1] px-3 py-2 text-[14px] text-[#0c0a09] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1]"
              />
            </div>
            <div>
              <label
                htmlFor="new-book-author"
                className="block text-[13px] font-medium text-[#0c0a09] mb-1.5"
              >
                نویسنده
              </label>
              <input
                id="new-book-author"
                type="text"
                value={bookAuthor}
                onChange={(e) => setBookAuthor(e.target.value)}
                placeholder="مثلاً Robert C. Martin"
                className="w-full bg-white rounded-[6px] border border-[#d6d3d1] px-3 py-2 text-[14px] text-[#0c0a09] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1]"
              />
            </div>
            <div>
              <label
                htmlFor="new-book-topic"
                className="block text-[13px] font-medium text-[#0c0a09] mb-1.5"
              >
                حوزه موضوعی
              </label>
              <input
                id="new-book-topic"
                type="text"
                value={bookTopic}
                onChange={(e) => setBookTopic(e.target.value)}
                placeholder="مثلاً معماری نرم‌افزار"
                className="w-full bg-white rounded-[6px] border border-[#d6d3d1] px-3 py-2 text-[14px] text-[#0c0a09] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1]"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="new-book-desc"
              className="block text-[13px] font-medium text-[#0c0a09] mb-1.5"
            >
              توضیحات کوتاه
            </label>
            <textarea
              id="new-book-desc"
              rows={2}
              value={bookDesc}
              onChange={(e) => setBookDesc(e.target.value)}
              placeholder="خلاصه‌ای از مباحث کلیدی این کتاب..."
              className="w-full bg-white rounded-[6px] border border-[#d6d3d1] px-3 py-2 text-[14px] text-[#0c0a09] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1]"
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowNewBookForm(false)}
              className="rounded-full border border-[#e8e6e5] px-4 py-2 text-[13px] text-[#0c0a09] cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={savingBook}
              className="rounded-full bg-[#1c1917] text-white font-medium px-5 py-2 text-[13px] hover:bg-[#0c0a09] disabled:opacity-60 cursor-pointer"
            >
              {savingBook ? 'در حال ثبت...' : 'ذخیره کتاب'}
            </button>
          </div>
        </form>
      )}

      {/* Two-column Admin Workspace */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar: Books List */}
        <aside className="lg:col-span-4 rounded-[10px] bg-white border border-[#e8e6e5] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between pb-3 border-b border-[#e8e6e5]">
            <h2 className="text-[15px] font-medium text-[#0c0a09]">
              کتاب‌های تعریف‌شده
            </h2>
            <span className="text-[12px] text-[#78716c] font-mono tabular-nums">
              {books.length}
            </span>
          </div>

          {books.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[#78716c]">
              هنوز کتابی ثبت نشده است.
            </p>
          ) : (
            <div className="mt-2 divide-y divide-[#e8e6e5]">
              {books.map((book) => {
                const active = book.id === selectedBook?.id;
                return (
                  <div
                    key={book.id}
                    className={`py-3 px-2.5 -mx-2.5 rounded-[8px] transition-colors flex items-start justify-between gap-2 ${
                      active
                        ? 'bg-[#c1e1f7]/25'
                        : 'bg-transparent hover:bg-[#fafaf9]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedBookId(book.id)}
                      className="text-right flex-1 min-w-0 cursor-pointer"
                    >
                      <div
                        dir="auto"
                        className={`text-[14px] font-medium font-latin truncate text-start ${
                          active ? 'text-[#3398e1]' : 'text-[#0c0a09]'
                        }`}
                      >
                        {book.title}
                      </div>
                      <div className="mt-1 text-[12px] text-[#78716c] tabular-nums">
                        {book.author} · {book.chapters.length} فصل ·{' '}
                        {book.totalQuestions} سوال
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteBook(book.id)}
                      aria-label={`حذف کتاب ${book.title}`}
                      className="p-1.5 rounded-full text-[#a8a29e] hover:text-[#991b1b] hover:bg-[#fef2f2] transition-colors shrink-0 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* Main Panel: Chapters & Question Bank */}
        <div className="lg:col-span-8 space-y-6">
          {!selectedBook ? (
            <div className="rounded-[10px] bg-white border border-[#e8e6e5] p-12 text-center text-[14px] text-[#78716c]">
              برای مدیریت فصل‌ها و آپلود سوالات JSON، یک کتاب را از ستون کناری انتخاب کنید یا کتاب جدیدی بسازید.
            </div>
          ) : (
            <>
              {/* Active Book Header & Mode Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2
                    dir="auto"
                    className="text-[22px] font-medium text-[#0c0a09] font-latin"
                  >
                    {selectedBook.title}
                  </h2>
                  <p className="text-[13px] text-[#78716c]">
                    {selectedBook.author} · {selectedBook.topic}
                  </p>
                </div>

                <div
                  className="flex items-center gap-2 shrink-0"
                  role="tablist"
                  aria-label="بخش‌های مدیریت کتاب"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'chapters'}
                    onClick={() => setActiveTab('chapters')}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === 'chapters'
                        ? 'bg-[#1c1917] text-white font-medium'
                        : 'border border-[#e8e6e5] bg-white text-[#0c0a09] hover:border-[#d6d3d1]'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>فصل‌ها و تنظیمات</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'questions'}
                    onClick={() => setActiveTab('questions')}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[13px] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      activeTab === 'questions'
                        ? 'bg-[#1c1917] text-white font-medium'
                        : 'border border-[#e8e6e5] bg-white text-[#0c0a09] hover:border-[#d6d3d1]'
                    }`}
                  >
                    <FileJson className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>آپلود JSON و سوالات</span>
                  </button>
                </div>
              </div>

              {activeTab === 'chapters' && (
                <div className="space-y-6">
                  {/* Add New Chapter Form */}
                  <form
                    onSubmit={handleCreateChapter}
                    className="rounded-[10px] bg-white border border-[#e8e6e5] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)] space-y-4"
                  >
                    <h3 className="text-[16px] font-medium text-[#0c0a09]">
                      افزودن فصل جدید به کتاب
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <label
                          htmlFor="new-chapter-title"
                          className="block text-[13px] font-medium text-[#0c0a09] mb-1.5"
                        >
                          عنوان فصل
                        </label>
                        <input
                          id="new-chapter-title"
                          type="text"
                          value={chapterTitle}
                          onChange={(e) => setChapterTitle(e.target.value)}
                          placeholder="مثلاً Chapter 6: General-Purpose Modules are Deeper"
                          className="w-full bg-white rounded-[6px] border border-[#d6d3d1] px-3 py-2 text-[14px] text-[#0c0a09] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="new-chapter-count"
                          className="block text-[13px] font-medium text-[#0c0a09] mb-1.5"
                        >
                          تعداد سوال تصادفی آزمون
                        </label>
                        <input
                          id="new-chapter-count"
                          type="number"
                          min={1}
                          max={100}
                          value={chapterQuizCount}
                          onChange={(e) =>
                            setChapterQuizCount(Math.max(1, Number(e.target.value) || 1))
                          }
                          className="w-full bg-white rounded-[6px] border border-[#d6d3d1] px-3 py-2 text-[14px] font-mono tabular-nums text-[#0c0a09] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1]"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="new-chapter-desc"
                        className="block text-[13px] font-medium text-[#0c0a09] mb-1.5"
                      >
                        توضیحات فصل (اختیاری)
                      </label>
                      <input
                        id="new-chapter-desc"
                        type="text"
                        value={chapterDesc}
                        onChange={(e) => setChapterDesc(e.target.value)}
                        placeholder="شرح کوتاه مباحثی که در این فصل پوشش داده می‌شود"
                        className="w-full bg-white rounded-[6px] border border-[#d6d3d1] px-3 py-2 text-[14px] text-[#0c0a09] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1]"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingChapter}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#1c1917] text-white font-medium px-5 py-2 text-[13px] hover:bg-[#0c0a09] disabled:opacity-60 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>{savingChapter ? 'در حال ثبت...' : 'افزودن فصل'}</span>
                      </button>
                    </div>
                  </form>

                  {/* Ordered Chapters Management */}
                  <div className="rounded-[10px] bg-white border border-[#e8e6e5] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center justify-between pb-4 border-b border-[#e8e6e5]">
                      <h3 className="text-[16px] font-medium text-[#0c0a09]">
                        فهرست و ترتیب فصل‌ها
                      </h3>
                      <span className="text-[12px] text-[#78716c]">
                        امکان جابه‌جایی ترتیب و تنظیم تعداد سوالات آزمون
                      </span>
                    </div>

                    {selectedBook.chapters.length === 0 ? (
                      <p className="py-8 text-center text-[14px] text-[#78716c]">
                        هنوز فصلی برای این کتاب تعریف نشده است.
                      </p>
                    ) : (
                      <div className="divide-y divide-[#e8e6e5]">
                        {selectedBook.chapters.map((ch, idx) => {
                          const countValue =
                            editingCounts[ch.id] ?? ch.quizQuestionCount;
                          const isDirty = countValue !== ch.quizQuestionCount;
                          const justSaved = savedCountId === ch.id;

                          return (
                            <div
                              key={ch.id}
                              className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="flex flex-col gap-1 shrink-0 pt-0.5">
                                  <button
                                    type="button"
                                    disabled={idx === 0}
                                    onClick={() => handleMoveChapter(idx, -1)}
                                    aria-label={`انتقال فصل ${ch.title} به بالا`}
                                    className="p-1 rounded border border-[#e8e6e5] text-[#78716c] hover:text-[#0c0a09] disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowUp className="w-3 h-3" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={idx === selectedBook.chapters.length - 1}
                                    onClick={() => handleMoveChapter(idx, 1)}
                                    aria-label={`انتقال فصل ${ch.title} به پایین`}
                                    className="p-1 rounded border border-[#e8e6e5] text-[#78716c] hover:text-[#0c0a09] disabled:opacity-30 cursor-pointer"
                                  >
                                    <ArrowDown className="w-3 h-3" />
                                  </button>
                                </div>

                                <div className="min-w-0">
                                  <div className="text-[12px] text-[#78716c] tabular-nums">
                                    فصل{' '}
                                    <span className="font-mono">
                                      {String(idx + 1).padStart(2, '0')}
                                    </span>{' '}
                                    · بانک سوال:{' '}
                                    <span className="font-mono">
                                      {ch.totalQuestions}
                                    </span>
                                  </div>
                                  <div
                                    dir="auto"
                                    className="text-[15px] font-medium text-[#0c0a09] font-latin mt-0.5"
                                  >
                                    {ch.title}
                                  </div>
                                  {ch.description && (
                                    <p className="text-[13px] text-[#78716c] mt-0.5">
                                      {ch.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <label
                                  htmlFor={`quiz-count-${ch.id}`}
                                  className="text-[12px] text-[#78716c]"
                                >
                                  تعداد آزمون:
                                </label>
                                <input
                                  id={`quiz-count-${ch.id}`}
                                  type="number"
                                  min={1}
                                  max={100}
                                  value={countValue}
                                  onChange={(e) =>
                                    setEditingCounts((prev) => ({
                                      ...prev,
                                      [ch.id]: Math.max(
                                        1,
                                        Number(e.target.value) || 1
                                      ),
                                    }))
                                  }
                                  className="w-16 bg-white rounded-[6px] border border-[#d6d3d1] px-2 py-1 text-[13px] font-mono tabular-nums text-[#0c0a09] text-center focus:outline-none focus:ring-2 focus:ring-[#3ba6f1]"
                                />

                                {(isDirty || justSaved) && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveChapterQuizCount(ch.id, countValue)
                                    }
                                    className="inline-flex items-center gap-1 rounded-full bg-[#3ba6f1] text-white px-3 py-1 text-[12px] font-medium cursor-pointer"
                                  >
                                    <Check className="w-3 h-3" />
                                    <span>{justSaved ? 'ذخیره شد' : 'ثبت'}</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedChapterId(ch.id);
                                    setActiveTab('questions');
                                  }}
                                  className="rounded-full border border-[#e8e6e5] px-3 py-1 text-[12px] text-[#3398e1] hover:border-[#3ba6f1] hover:bg-[#c1e1f7]/20 transition-colors cursor-pointer"
                                >
                                  بانک سوال
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleDeleteChapter(ch.id)}
                                  aria-label={`حذف فصل ${ch.title}`}
                                  className="p-1.5 rounded-full text-[#a8a29e] hover:text-[#991b1b] hover:bg-[#fef2f2] transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'questions' && (
                <div className="space-y-6">
                  {selectedBook.chapters.length === 0 ? (
                    <div className="rounded-[10px] bg-white border border-[#e8e6e5] p-10 text-center text-[14px] text-[#78716c]">
                      ابتدا در تب «فصل‌ها و تنظیمات» حداقل یک فصل برای این کتاب تعریف کنید.
                    </div>
                  ) : (
                    <>
                      {/* Chapter selector */}
                      <div className="rounded-[10px] bg-white border border-[#e8e6e5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label
                          htmlFor="admin-chapter-select"
                          className="text-[13px] font-medium text-[#0c0a09] shrink-0"
                        >
                          انتخاب فصل برای آپلود سوالات:
                        </label>
                        <select
                          id="admin-chapter-select"
                          value={selectedChapter?.id ?? ''}
                          onChange={(e) => setSelectedChapterId(e.target.value)}
                          className="w-full sm:w-auto sm:min-w-[320px] bg-white rounded-[6px] border border-[#d6d3d1] px-3 py-2 text-[13px] text-[#0c0a09] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1]"
                        >
                          {selectedBook.chapters.map((c, i) => (
                            <option key={c.id} value={c.id}>
                              {String(i + 1).padStart(2, '0')}. {c.title} ({c.totalQuestions}{' '}
                              سوال)
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedChapter && (
                        <AdminJsonUploader
                          key={selectedChapter.id}
                          chapter={selectedChapter}
                          onQuestionsChanged={fetchBooks}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
