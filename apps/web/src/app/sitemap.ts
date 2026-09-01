import type { MetadataRoute } from 'next';

/**
 * Sitemap cơ bản. Khi có dữ liệu tin đăng thật với số lượng lớn, tách thành nhiều
 * sitemap con (sitemap-listings-1.xml, sitemap-projects.xml...) theo CLAUDE.md § 2.6
 * thay vì 1 file duy nhất (giới hạn 50.000 URL/file của chuẩn sitemap).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/mua-ban`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/thue`, changeFrequency: 'daily', priority: 0.9 },
  ];
}
