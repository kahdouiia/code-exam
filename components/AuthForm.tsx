'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeft, Shield, User } from 'lucide-react';
import { useAuth } from './AuthProvider';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next') || '/';
  const { setUser } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'register' && name.trim().length < 2) {
      setError('نام و نام خانوادگی باید حداقل ۲ کاراکتر باشد.');
      return;
    }
    if (!email.trim() || !password) {
      setError('لطفاً ایمیل و رمز عبور را وارد کنید.');
      return;
    }
    if (mode === 'register' && password.length < 6) {
      setError('رمز عبور باید حداقل ۶ کاراکتر باشد.');
      return;
    }

    setSubmitting(true);
    try {
      const endpoint =
        mode === 'register' ? '/api/auth/register' : '/api/auth/login';
      const payload =
        mode === 'register' ? { name, email, password } : { email, password };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'عملیات ناموفق بود.');
        return;
      }

      setUser(data.user);
      const target =
        nextUrl !== '/'
          ? nextUrl
          : data.user?.role === 'admin'
            ? '/admin'
            : '/';
      router.push(target);
      router.refresh();
    } catch {
      setError('خطا در برقراری ارتباط با سرور.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24 flex justify-center">
      <div className="w-full max-w-[440px]">
        <div className="mb-8 text-center">
          <h1 className="text-[32px] font-normal leading-[1.25] tracking-[-0.02em] text-[#0c0a09]">
            {mode === 'login' ? (
              <>
                ورود به{' '}
                <span className="bg-[#c1e1f7] text-[#3398e1] px-2 py-0.5 rounded-[4px]">
                  کدآزمون
                </span>
              </>
            ) : (
              <>
                ساخت حساب{' '}
                <span className="bg-[#c1e1f7] text-[#3398e1] px-2 py-0.5 rounded-[4px]">
                  جدید
                </span>
              </>
            )}
          </h1>
          <p className="mt-2 text-[14px] text-[#78716c]">
            {mode === 'login'
              ? 'با ایمیل و رمز عبور خود وارد شوید تا آزمون دهید یا بانک سوالات را مدیریت کنید.'
              : 'ثبت‌نام کنید تا در آزمون‌های فصل‌بندی‌شده کتاب‌ها شرکت کرده و کارنامه‌های خود را ذخیره کنید.'}
          </p>
        </div>

        <div className="rounded-[10px] bg-white border border-[#e8e6e5] p-6 sm:p-8 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mode === 'register' && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="block text-[13px] font-medium text-[#0c0a09] mb-1.5"
                >
                  نام و نام خانوادگی
                </label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً علی رضایی"
                  className="w-full bg-white rounded-[6px] border border-[#d6d3d1] px-3 py-2 text-[14px] text-[#0c0a09] placeholder:text-[#78716c] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1] focus:border-[#3ba6f1]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="block text-[13px] font-medium text-[#0c0a09] mb-1.5"
              >
                نشانی ایمیل
              </label>
              <input
                id="auth-email"
                type="email"
                dir="ltr"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-white rounded-[6px] border border-[#d6d3d1] px-3 py-2 text-[14px] text-[#0c0a09] placeholder:text-[#78716c] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1] focus:border-[#3ba6f1] text-left"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="block text-[13px] font-medium text-[#0c0a09] mb-1.5"
              >
                رمز عبور
              </label>
              <input
                id="auth-password"
                type="password"
                dir="ltr"
                autoComplete={
                  mode === 'register' ? 'new-password' : 'current-password'
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="حداقل ۶ کاراکتر"
                className="w-full bg-white rounded-[6px] border border-[#d6d3d1] px-3 py-2 text-[14px] text-[#0c0a09] placeholder:text-[#78716c] focus:outline-none focus:ring-2 focus:ring-[#3ba6f1] focus:border-[#3ba6f1] text-left"
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-[6px] border border-[#fecaca] bg-[#fef2f2] px-3 py-2.5 text-[13px] text-[#991b1b]"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-4 py-2.5 text-[14px] hover:bg-[#3398e1] transition-colors disabled:opacity-60 cursor-pointer"
            >
              <span>
                {submitting
                  ? 'در حال ارسال...'
                  : mode === 'login'
                    ? 'ورود به حساب'
                    : 'ثبت‌نام و شروع'}
              </span>
              <ArrowLeft className="w-4 h-4 stroke-[1.75]" aria-hidden="true" />
            </button>
          </form>

          {mode === 'login' && (
            <div className="mt-6 pt-5 border-t border-[#e8e6e5]">
              <p className="text-[12px] text-[#78716c] mb-3">
                حساب‌های آماده برای بررسی سریع:
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() =>
                    fillDemoAccount('admin@codeexam.dev', 'admin1234')
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#e8e6e5] px-3 py-2 text-[12px] text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-[#fafaf9] transition-colors cursor-pointer"
                >
                  <Shield className="w-3.5 h-3.5 text-[#3398e1]" aria-hidden="true" />
                  <span>پر کردن حساب ادمین</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    fillDemoAccount('student@codeexam.dev', 'student1234')
                  }
                  className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#e8e6e5] px-3 py-2 text-[12px] text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-[#fafaf9] transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-[#78716c]" aria-hidden="true" />
                  <span>پر کردن حساب کاربر</span>
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-4 border-t border-[#e8e6e5] text-center text-[13px] text-[#78716c]">
            {mode === 'login' ? (
              <>
                هنوز حساب کاربری ندارید؟{' '}
                <Link
                  href="/register"
                  className="text-[#3398e1] hover:text-[#0c0a09] font-medium"
                >
                  ثبت‌نام کنید
                </Link>
              </>
            ) : (
              <>
                قبلاً ثبت‌نام کرده‌اید؟{' '}
                <Link
                  href="/login"
                  className="text-[#3398e1] hover:text-[#0c0a09] font-medium"
                >
                  وارد شوید
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
