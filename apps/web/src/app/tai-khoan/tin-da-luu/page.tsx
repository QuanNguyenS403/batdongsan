'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authFetch, isLoggedIn } from '@/lib/auth-client';
import { formatPrice, Listing, ListingListResponse } from '@/lib/api';

export default function TinDaLuuPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  const loadSaved = useCallback(async (targetPage = 1) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`/listings/saved/mine?page=${targetPage}&pageSize=10`);
      if (res.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại');
        setListings([]);
        return;
      }
      if (!res.ok) throw new Error('Không tải được danh sách tin đã lưu');
      const data: ListingListResponse = await res.json();
      setListings(data.items);
      setTotal(data.pagination.total);
      setPage(data.pagination.page);
      setTotalPages(data.pagination.totalPages || 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/dang-nhap');
      return;
    }
    setCheckedAuth(true);
  }, [router]);

  useEffect(() => {
    if (checkedAuth) loadSaved(page);
  }, [checkedAuth, loadSaved, page]);

  async function handleUnsave(listingId: string) {
    try {
      const res = await authFetch(`/listings/${listingId}/save`, { method: 'POST' });
      if (res.ok) {
        // Cập nhật state loại bỏ tin vừa bỏ lưu
        setListings((prev) => prev.filter((item) => item.id !== listingId));
        setTotal((prev) => Math.max(0, prev - 1));
      }
    } catch {
      alert('Không thể bỏ lưu tin đăng. Vui lòng thử lại');
    }
  }

  if (!checkedAuth) return null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between border-b border-surface-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Bất động sản đã lưu</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Danh sách những bất động sản bạn đang theo dõi và quan tâm.
          </p>
        </div>
        <span className="rounded-full bg-rose-50 border border-rose-200 px-3.5 py-1.5 text-xs font-bold text-rose-600">
          ❤️ {total} tin đã lưu
        </span>
      </div>

      {loading && <p className="mt-6 text-sm text-text-muted">Đang tải danh sách tin đã lưu...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          {listings.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-surface-border bg-white p-12 text-center">
              <span className="text-4xl">🤍</span>
              <h3 className="mt-3 text-base font-bold text-text-primary">Bạn chưa lưu bất động sản nào</h3>
              <p className="mt-1 text-sm text-text-secondary max-w-md mx-auto">
                Khi tìm kiếm nhà đất, hãy bấm vào nút &quot;Lưu tin&quot; trên trang chi tiết để lưu lại và theo dõi bất cứ lúc nào.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link
                  href="/thue"
                  className="btn-primary"
                >
                  Khám phá phòng trọ & căn hộ cho thuê
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mt-6 divide-y divide-surface-border rounded-2xl border border-surface-border bg-white shadow-card overflow-hidden">
                {listings.map((listing) => (
                  <div key={listing.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/50 transition-colors">
                    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {listing.images[0]?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={listing.images[0].imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-text-muted">Chưa có ảnh</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/tin/${listing.slug}`}
                        className="line-clamp-1 font-semibold text-text-primary hover:text-brand transition-colors"
                      >
                        {listing.title}
                      </Link>
                      <p className="mt-0.5 text-xs text-text-muted">{listing.addressDetail ?? listing.location.name}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs text-text-secondary">
                        <span className="font-bold text-brand text-sm">{formatPrice(listing.price)}</span>
                        {listing.transactionType === 'rent' && <span className="text-[11px] text-text-muted">/tháng</span>}
                        <span>•</span>
                        <span>{listing.areaM2} m²</span>
                        {listing.bedrooms != null && (
                          <>
                            <span>•</span>
                            <span>{listing.bedrooms} PN</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Link
                        href={`/tin/${listing.slug}`}
                        className="rounded-xl border border-surface-border bg-white px-3.5 py-1.5 text-xs font-semibold text-text-secondary hover:border-brand hover:text-brand transition-colors"
                      >
                        Xem chi tiết
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleUnsave(listing.id)}
                        className="rounded-xl px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Bỏ lưu tin này"
                      >
                        Bỏ lưu
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Phân trang (FE-N08) */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between rounded-2xl border border-surface-border bg-white px-6 py-4 shadow-sm">
                  <p className="text-xs text-text-muted">
                    Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> (tổng số {total} tin đã lưu)
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1 || loading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3.5 py-1.5 bg-white border border-surface-border text-text-primary text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-surface-muted transition-colors"
                    >
                      ← Trang trước
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages || loading}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3.5 py-1.5 bg-white border border-surface-border text-text-primary text-xs font-semibold rounded-lg disabled:opacity-40 hover:bg-surface-muted transition-colors"
                    >
                      Trang sau →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
