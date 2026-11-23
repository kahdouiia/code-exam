'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileJson,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import { parseQuestionsJson, SAMPLE_QUESTIONS_JSON } from '@/lib/quiz-parser';
import type { ChapterSummary, Question } from '@/lib/types';

interface AdminJsonUploaderProps {
  chapter: ChapterSummary;
  onQuestionsChanged: () => Promise<void>;
}

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

export function AdminJsonUploader({
  chapter,
  onQuestionsChanged,
}: AdminJsonUploaderProps) {
  const [rawJson, setRawJson] = useState('');
  const [mode, setMode] = useState<'append' | 'replace'>('append');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingBank, setLoadingBank] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/chapters/${chapter.id}/questions`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { questions: [] }))
      .then((data) => {
        if (active) {
          setQuestions(Array.isArray(data.questions) ? data.questions : []);
        }
      })
      .finally(() => {
        if (active) setLoadingBank(false);
      });
    return () => {
      active = false;
    };
  }, [chapter.id]);

  const parsedPreview = useMemo(() => {
    if (!rawJson.trim()) return null;
    return parseQuestionsJson(rawJson);
  }, [rawJson]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMessage(null);
    setServerError(null);
    try {
      const text = await file.text();
      setRawJson(text);
    } catch {
      setServerError('خواندن فایل JSON با خطا مواجه شد.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadSample = () => {
    const blob = new Blob([SAMPLE_QUESTIONS_JSON], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample-chapter-questions.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);
    setServerError(null);

    if (!parsedPreview || !parsedPreview.ok) {
      setServerError(
        parsedPreview && !parsedPreview.ok
          ? parsedPreview.errors[0]
          : 'لطفاً فایل یا متن JSON سوالات را وارد کنید.'
      );
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/chapters/${chapter.id}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawJson, mode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || 'خطا در ذخیره سوالات.');
        return;
      }

      setQuestions(Array.isArray(data.questions) ? data.questions : []);
      setRawJson('');
      setStatusMessage(
        `${data.addedCount} سوال جدید با موفقیت پارس و در دیتابیس فصل ذخیره شد (مجموع بانک: ${data.totalQuestions} سوال).`
      );
      await onQuestionsChanged();
    } catch {
      setServerError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    const res = await fetch(`/api/questions/${questionId}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setQuestions((prev) => prev.filter((q) => q.id !== questionId));
      await onQuestionsChanged();
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Card */}
      <form
        onSubmit={handleUploadSubmit}
        className="rounded-[10px] bg-white border border-[#e8e6e5] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)] space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#e8e6e5]">
          <div>
            <h3 className="text-[18px] font-medium text-[#0c0a09]">
              آپلود بانک سوال JSON
            </h3>
            <p className="text-[13px] text-[#78716c] mt-1">
              فصل انتخاب‌شده:{' '}
              <span dir="ltr" className="font-latin text-[#0c0a09]">
                {chapter.title}
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setRawJson(SAMPLE_QUESTIONS_JSON);
                setServerError(null);
                setStatusMessage(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e6e5] px-3.5 py-1.5 text-[12px] text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-[#fafaf9] cursor-pointer"
            >
              <FileJson className="w-3.5 h-3.5 text-[#3398e1]" aria-hidden="true" />
              <span>درج نمونه JSON</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadSample}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e6e5] px-3.5 py-1.5 text-[12px] text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-[#fafaf9] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#78716c]" aria-hidden="true" />
              <span>دانلود نمونه</span>
            </button>
          </div>
        </div>

        {/* File Picker Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[8px] border border-dashed border-[#d6d3d1] bg-[#fafaf9] p-4">
          <div className="text-[13px] text-[#78716c] leading-[1.6]">
            <p className="text-[#0c0a09] font-medium">
              انتخاب فایل <span className="font-mono">.json</span> یا جای‌گذاری مستقیم متن
            </p>
            <p className="mt-0.5 text-[12px]">
              فرمت مورد انتظار: آرایه‌ای از آبجکت‌ها با فیلدهای{' '}
              <code dir="ltr" className="font-mono text-[#0c0a09]">
                question
              </code>
              ،{' '}
              <code dir="ltr" className="font-mono text-[#0c0a09]">
                answers
              </code>{' '}
              (۴ گزینه) و{' '}
              <code dir="ltr" className="font-mono text-[#0c0a09]">
                correct_answer
              </code>
            </p>
          </div>

          <div className="shrink-0">
            <input
              ref={fileInputRef}
              id="json-file-upload"
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="sr-only"
            />
            <label
              htmlFor="json-file-upload"
              className="inline-flex items-center gap-2 rounded-full border border-[#d6d3d1] bg-white px-4 py-2 text-[13px] text-[#0c0a09] hover:border-[#0c0a09] transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" aria-hidden="true" />
              <span>انتخاب فایل JSON</span>
            </label>
          </div>
        </div>

        {/* Raw JSON Textarea */}
        <div>
          <label
            htmlFor="json-editor"
            className="block text-[13px] font-medium text-[#0c0a09] mb-1.5"
          >
            محتوای JSON سوالات
          </label>
          <textarea
            id="json-editor"
            dir="ltr"
            rows={10}
            value={rawJson}
            onChange={(e) => {
              setRawJson(e.target.value);
              setServerError(null);
            }}
            placeholder='[&#10;  {&#10;    "question": "Question text...",&#10;    "answers": ["Option 1", "Option 2", "Option 3", "Option 4"],&#10;    "correct_answer": "Option 1"&#10;  }&#10;]'
            className="w-full bg-white rounded-[6px] border border-[#d6d3d1] p-3 text-[13px] font-mono text-[#0c0a09] placeholder:text-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1] focus:border-[#3ba6f1] text-left"
          />
        </div>

        {/* Live Validation Preview */}
        {parsedPreview && (
          <div
            className={`rounded-[8px] border px-4 py-3 text-[13px] ${
              parsedPreview.ok
                ? 'border-[#3ba6f1]/40 bg-[#c1e1f7]/25 text-[#0c0a09]'
                : 'border-[#fecaca] bg-[#fef2f2] text-[#991b1b]'
            }`}
          >
            {parsedPreview.ok ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#3398e1] shrink-0" />
                <span>
                  ساختار JSON معتبر است —{' '}
                  <strong className="font-mono tabular-nums">
                    {parsedPreview.questions.length}
                  </strong>{' '}
                  سوال چهارگزینه‌ای آماده ذخیره در دیتابیس.
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>خطا در اعتبارسنجی JSON:</span>
                </div>
                <ul className="list-disc pr-5 space-y-0.5 text-[12px]">
                  {parsedPreview.errors.slice(0, 5).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {serverError && (
          <div
            role="alert"
            className="flex items-center gap-2 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[13px] text-[#991b1b]"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {statusMessage && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-[6px] border border-[#3ba6f1]/40 bg-[#c1e1f7]/30 px-3 py-2.5 text-[13px] text-[#0c0a09]"
          >
            <CheckCircle2 className="w-4 h-4 text-[#3398e1] shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Mode & Submit */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMode('append')}
              className={`rounded-full px-3.5 py-1.5 text-[12px] transition-colors cursor-pointer ${
                mode === 'append'
                  ? 'bg-[#1c1917] text-white font-medium'
                  : 'border border-[#e8e6e5] text-[#0c0a09] hover:border-[#d6d3d1]'
              }`}
            >
              افزودن به سوالات فعلی
            </button>
            <button
              type="button"
              onClick={() => setMode('replace')}
              className={`rounded-full px-3.5 py-1.5 text-[12px] transition-colors cursor-pointer ${
                mode === 'replace'
                  ? 'bg-[#1c1917] text-white font-medium'
                  : 'border border-[#e8e6e5] text-[#0c0a09] hover:border-[#d6d3d1]'
              }`}
            >
              جایگزینی کل سوالات فصل
            </button>
          </div>

          <button
            type="submit"
            disabled={saving || !parsedPreview?.ok}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-5 py-2 text-[14px] hover:bg-[#3398e1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>ذخیره سوالات در دیتابیس</span>
          </button>
        </div>
      </form>

      {/* Existing Question Bank List */}
      <div className="rounded-[10px] bg-white border border-[#e8e6e5] p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between pb-4 border-b border-[#e8e6e5]">
          <h3 className="text-[17px] font-medium text-[#0c0a09]">
            سوالات ذخیره‌شده در این فصل
          </h3>
          <span className="text-[13px] text-[#78716c] tabular-nums">
            <span className="font-mono">{questions.length}</span> سوال در بانک ·{' '}
            <span className="font-mono">{chapter.quizQuestionCount}</span> سوال در هر آزمون
          </span>
        </div>

        {loadingBank ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#3ba6f1]" />
          </div>
        ) : questions.length === 0 ? (
          <p className="py-10 text-center text-[14px] text-[#78716c]">
            هنوز هیچ سوالی برای این فصل آپلود نشده است. از فرم بالا فایل JSON خود را بارگذاری کنید.
          </p>
        ) : (
          <div className="divide-y divide-[#e8e6e5]">
            {questions.map((q, idx) => (
              <div key={q.id} className="py-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <span
                      dir="ltr"
                      className="font-mono text-[12px] text-[#78716c] mt-1 shrink-0 tabular-nums"
                    >
                      {String(idx + 1).padStart(2, '0')}.
                    </span>
                    <p
                      dir="auto"
                      className="text-[15px] font-medium text-[#0c0a09] font-latin leading-[1.55] flex-1 text-start"
                    >
                      {q.question}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteQuestion(q.id)}
                    aria-label={`حذف سوال ${idx + 1}`}
                    className="p-1.5 rounded-full text-[#a8a29e] hover:text-[#991b1b] hover:bg-[#fef2f2] transition-colors shrink-0 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-6">
                  {q.answers.map((ans, optIdx) => {
                    const isCorrect = optIdx === q.correctIndex;
                    return (
                      <div
                        key={optIdx}
                        className={`rounded-[6px] border px-3 py-2 text-[13px] flex items-start gap-2 ${
                          isCorrect
                            ? 'border-[#3ba6f1] bg-[#c1e1f7]/25 text-[#0c0a09]'
                            : 'border-[#e8e6e5] bg-[#fafaf9] text-[#78716c]'
                        }`}
                      >
                        <span
                          dir="ltr"
                          className="font-mono text-[11px] mt-0.5 shrink-0 font-medium"
                        >
                          {OPTION_LABELS[optIdx]}.
                        </span>
                        <span dir="auto" className="font-latin flex-1 text-start">
                          {ans}
                        </span>
                        {isCorrect && (
                          <CheckCircle2
                            className="w-3.5 h-3.5 text-[#3398e1] shrink-0 mt-0.5"
                            aria-label="پاسخ صحیح"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
