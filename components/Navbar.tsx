'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Flame, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from './AuthProvider';

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileOpen(false);
    router.push('/');
    router.refresh();
  };

  const navItems = [
    { href: '/', label: 'کتابخانه' },
    { href: '/history', label: 'سوابق آزمون' },
    ...(user?.role === 'admin' ? [{ href: '/admin', label: 'پنل ادمین' }] : []),
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#fafaf9]/95 backdrop-blur-sm border-b border-[#e8e6e5]">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Compact Brand Wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 text-[14px] font-medium text-[#0c0a09] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3ba6f1] rounded-md"
        >
          <Flame className="w-4 h-4 text-[#0c0a09] stroke-[1.75]" aria-hidden="true" />
          <span>کدآزمون</span>
        </Link>

        {/* Zone 2: Clean Single-Line Nav Links */}
        <nav
          aria-label="ناوبری اصلی"
          className="hidden md:flex items-center gap-2"
        >
          {navItems.map((item) => {
            const active =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 h-8 inline-flex items-center text-[14px] whitespace-nowrap shrink-0 transition-colors rounded-md ${
                  active
                    ? 'text-[#0c0a09] font-medium'
                    : 'text-[#78716c] hover:text-[#0c0a09]'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: Auth Actions */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {loading ? (
            <div className="h-8 w-24 rounded-full bg-[#e8e6e5]/60 animate-pulse" />
          ) : user ? (
            <>
              <span className="text-[13px] text-[#78716c] whitespace-nowrap max-w-[160px] truncate">
                {user.name}
              </span>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#e8e6e5] bg-transparent px-4 py-1.5 text-[13px] text-[#0c0a09] hover:border-[#d6d3d1] hover:bg-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[1.5]" aria-hidden="true" />
                <span>خروج</span>
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="px-3 py-1.5 text-[14px] text-[#78716c] hover:text-[#0c0a09] transition-colors whitespace-nowrap shrink-0"
              >
                ورود
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-[#3ba6f1] border border-[#3398e1] text-white font-medium px-4 py-1.5 text-[14px] hover:bg-[#3398e1] transition-colors whitespace-nowrap shrink-0 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
              >
                ثبت‌نام
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'بستن منو' : 'باز کردن منو'}
          aria-expanded={mobileOpen}
          className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-full border border-[#e8e6e5] text-[#0c0a09] hover:bg-white transition-colors cursor-pointer"
        >
          {mobileOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#e8e6e5] bg-[#ffffff] px-6 py-4 space-y-3">
          <nav className="flex flex-col gap-1" aria-label="ناوبری موبایل">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="py-2 text-[14px] text-[#0c0a09] hover:text-[#3398e1]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="pt-3 border-t border-[#e8e6e5] flex items-center justify-between gap-3">
            {user ? (
              <>
                <span className="text-[13px] text-[#78716c] truncate">
                  {user.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full border border-[#e8e6e5] px-4 py-1.5 text-[13px] text-[#0c0a09] cursor-pointer"
                >
                  خروج
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 w-full">
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center rounded-full border border-[#e8e6e5] py-2 text-[14px] text-[#0c0a09]"
                >
                  ورود
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 text-center rounded-full bg-[#3ba6f1] border border-[#3398e1] py-2 text-[14px] font-medium text-white"
                >
                  ثبت‌نام
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
