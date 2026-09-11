import type { MetadataRoute } from 'next';

/**
 * Sitemap cơ bản cho nền tảng chuyên biệt Cho thuê.
 * Khi số lượng tin tăng trưởng lớn, tự động sinh các sitemap con theo CLAUDE.md § 2.6.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return [
    { url: `${base}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/thue`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/cho-thue-tro`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/cho-thue-mat-bang`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/gioi-thieu`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/lien-he`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/dieu-khoan`, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/chinh-sach`, changeFrequency: 'monthly', priority: 0.4 },
  ];
}
