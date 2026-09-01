import type { Metadata } from 'next';
import './globals.css';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'BatDongSan.demo — Nền tảng mua bán, cho thuê nhà đất',
    template: '%s | BatDongSan.demo',
  },
  description: 'Sàn giao dịch bất động sản: mua bán, cho thuê nhà đất, căn hộ, đất nền trên toàn quốc.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
