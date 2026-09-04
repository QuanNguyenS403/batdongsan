const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export interface Listing {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  transactionType: 'sale' | 'rent';
  propertyType: string;
  price: string;
  areaM2: string;
  bedrooms: number | null;
  bathrooms: number | null;
  legalStatus: string | null;
  addressDetail: string | null;
  status: string;
  publishedAt: string | null;
  viewCount: number;
  images: { imageUrl: string; sortOrder: number }[];
  location: { id: number; name: string; slug: string; level: string };
  project: { id: string; name: string; slug: string } | null;
  owner: { id: string; fullName: string | null; avatarUrl: string | null; createdAt: string };
}

export interface ListingListResponse {
  items: Listing[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // Chống treo SSR nếu backend phản hồi chậm hoặc đang cold start (timeout 3.5s an toàn)
  const signal = init?.signal ?? AbortSignal.timeout(3500);
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    signal,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    // Trang danh sách/chi tiết cần dữ liệu tương đối mới — cache ngắn 60s (ISR-style) thay vì always dynamic hoàn toàn.
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    if (res.status === 404) throw new Error('NOT_FOUND');
    throw new Error(`API lỗi (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export function fetchListings(searchParams: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(searchParams).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  return apiFetch<ListingListResponse>(`/listings?${query.toString()}`);
}

export function fetchListingBySlug(slug: string) {
  return apiFetch<Listing>(`/listings/${slug}`);
}

export function formatPrice(price: string | number): string {
  const value = typeof price === 'string' ? Number(price) : price;
  if (!value || value <= 0) return 'Thoả thuận';
  if (value >= 1_000_000_000) {
    const ty = Math.floor(value / 1_000_000_000);
    const trieu = Math.round((value % 1_000_000_000) / 1_000_000);
    return trieu > 0 ? `${ty} tỷ ${trieu} triệu` : `${ty} tỷ`;
  }
  if (value >= 1_000_000) return `${Math.round(value / 1_000_000)} triệu`;
  return `${value.toLocaleString('vi-VN')} đ`;
}
