import { config as loadEnv } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// next.config.mjs là ES Module (đuôi .mjs) — KHÔNG có sẵn __dirname/__filename như CommonJS,
// dùng phải quy đổi qua import.meta.url. Lỗi "__dirname is not defined" đã bắt được ngay khi build.
const __dirname = dirname(fileURLToPath(import.meta.url));

// QUAN TRỌNG: Next.js mặc định CHỈ đọc file .env trong chính thư mục app (apps/web/.env),
// không tự động đọc .env ở gốc monorepo. Nếu bỏ qua bước này, mọi biến NEXT_PUBLIC_* sẽ
// undefined khi build/dev dù .env gốc đã điền đầy đủ — lỗi rất khó nhận ra vì không throw,
// code chỉ âm thầm dùng giá trị fallback "localhost" mặc định trong lib/api.ts.
// Nạp SAU khi Next.js đã tự đọc .env local của riêng app (nếu có) — không ghi đè biến đã tồn tại.
if (process.env.NODE_ENV === 'production') {
  loadEnv({ path: join(__dirname, '..', '..', '.env.production') });
}
loadEnv({ path: join(__dirname, '..', '..', '.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,
  images: {
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: '**' },
    ],
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';
    return [
      {
        source: '/uploads/:path*',
        destination: `${apiUrl}/uploads/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/mua-ban',
        destination: '/thue',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
