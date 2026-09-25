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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://qnsbroker.com'),
  title: {
    default: 'QNS BROKER — Rõ chi phí, đúng người cho thuê',
    template: '%s | QNS BROKER',
  },
  description:
    'Nền tảng kết nối tìm phòng trọ sinh viên, căn hộ dịch vụ, studio và mặt bằng cho thuê QNS BROKER — biểu phí điện nước minh bạch, kết nối đúng bên có quyền cho thuê',
  keywords: [
    'QNS BROKER',
    'qnsbroker.com',
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
    siteName: 'QNS BROKER',
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
