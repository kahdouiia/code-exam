import type { Metadata } from 'next';
import { JetBrains_Mono, Plus_Jakarta_Sans, Vazirmatn } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  weight: ['400', '500', '600'],
  variable: '--font-vazirmatn',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CodeExam — پلتفرم آزمون کتاب‌های مهندسی نرم‌افزار',
  description:
    'پلتفرم آزمون آنلاین کتاب‌های مهندسی نرم‌افزار با پنل مدیریت، آپلود بانک سوال JSON، احراز هویت JWT و پشتیبانی از PostgreSQL.',
  openGraph: {
    title: 'CodeExam — پلتفرم آزمون کتاب‌های مهندسی نرم‌افزار',
    description:
      'پلتفرم آزمون آنلاین کتاب‌های مهندسی نرم‌افزار با پنل مدیریت، آپلود بانک سوال JSON، احراز هویت JWT و پشتیبانی از PostgreSQL.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeExam — پلتفرم آزمون کتاب‌های مهندسی نرم‌افزار',
    description:
      'پلتفرم آزمون آنلاین کتاب‌های مهندسی نرم‌افزار با پنل مدیریت و آزمون‌های تصادفی چهارگزینه‌ای.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}
    >
      <body
        suppressHydrationWarning
        className="min-h-screen bg-[#fafaf9] text-[#0c0a09] font-sans antialiased flex flex-col selection:bg-[#c1e1f7] selection:text-[#0c0a09]"
      >
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-[#e8e6e5] mt-24 bg-[#fafaf9]">
            <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#78716c]">
              <p>کدآزمون — ارزیابی دقیق مفاهیم کتاب‌های مهندسی نرم‌افزار</p>
              <div className="flex items-center gap-4">
                <span>معماری نرم‌افزار</span>
                <span aria-hidden="true">·</span>
                <span>بازآرایی کد</span>
                <span aria-hidden="true">·</span>
                <span>سیستم‌های داده‌محور</span>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
