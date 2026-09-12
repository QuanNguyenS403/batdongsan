import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TopProgressBar } from '@/components/TopProgressBar';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BĐS Cho Thuê — Tìm phòng trọ, căn hộ & nhà cho thuê minh bạch',
    template: '%s | BĐS Cho Thuê',
  },
  description:
    'Nền tảng kết nối tìm phòng trọ sinh viên, căn hộ dịch vụ, studio và nhà nguyên căn chính chủ. Biểu phí điện nước minh bạch, kiểm định phòng thực tế.',
  keywords: [
    'thuê phòng trọ',
    'phòng trọ sinh viên',
    'căn hộ dịch vụ',
    'thuê studio',
    'nhà nguyên căn',
    'cho thuê mặt bằng',
    'bất động sản cho thuê',
  ],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'BĐS Cho Thuê',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-surface-muted font-sans antialiased">
        <Suspense fallback={null}>
          <TopProgressBar />
        </Suspense>
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
