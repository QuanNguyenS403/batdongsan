import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BatDongSan.vn — Mua bán, cho thuê nhà đất toàn quốc',
    template: '%s | BatDongSan.vn',
  },
  description:
    'Sàn giao dịch bất động sản hàng đầu: mua bán, cho thuê nhà, căn hộ, đất nền. Hàng nghìn tin đăng uy tín, cập nhật liên tục.',
  keywords: ['mua nhà', 'bán nhà', 'cho thuê nhà', 'bất động sản', 'căn hộ', 'đất nền'],
  openGraph: {
    type: 'website',
    locale: 'vi_VN',
    siteName: 'BatDongSan.vn',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-surface-muted font-sans antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
