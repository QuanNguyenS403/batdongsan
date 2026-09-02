'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authFetch, isLoggedIn } from '@/lib/auth-client';
import { formatPrice, Listing, ListingListResponse } from '@/lib/api';

/**
 * Trang "Quản lý tin bất động sản" — TRƯỚC ĐÂY HOÀN TOÀN CHƯA TỒN TẠI (phát hiện qua audit
 * 01/09/2026): người dùng đăng tin xong (trang /dang-tin) không có bất kỳ cách nào trong ứng
 * dụng để xem lại tin của chính mình, kể cả để biết tin đã được duyệt hay chưa — phải nhờ admin
 * vào Prisma Studio tra thủ công (đúng như ghi chú "known limitation" trong tài liệu bàn giao).
 * Trang này gọi endpoint `GET /listings/mine` (mới bổ sung ở đợt audit này) để đóng lại vòng lặp
 * "Đăng tin → Quản lý tin" đúng như đặc tả MVP gốc trong CLAUDE.md / README.md mục 14.
 */

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending: { label: 'Chờ duyệt', className: 'bg-amber-100 text-amber-700' },
  active: { label: 'Đang hiển thị', className: 'bg-green-100 text-green-700' },
  rejected: { label: 'Bị từ chối', className: 'bg-red-100 text-red-700' },
  expired: { label: 'Hết hạn', className: 'bg-gray-200 text-gray-600' },
  removed: { label: 'Đã gỡ', className: 'bg-gray-200 text-gray-500' },
};

const FILTER_TABS = [
  { value: '', label: 'Tất cả' },
  { value: 'pending', label: 'Chờ duyệt' },
  { value: 'active', label: 'Đang hiển thị' },
  { value: 'rejected', label: 'Bị từ chối' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'removed', label: 'Đã gỡ' },
];

export default function QuanLyTinPage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkedAuth, setCheckedAuth] = useState(false);

  const load = useCallback(async (status: string) => {
    setLoading(true);
    setError(null);
    try {
      const query = status ? `?status=${status}&pageSize=50` : '?pageSize=50';
      const res = await authFetch(`/listings/mine${query}`);
      if (res.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        setListings([]);
        return;
      }
      if (!res.ok) throw new Error('Không tải được danh sách tin đăng.');
      const data: ListingListResponse = await res.json();
      setListings(data.items);
      setTotal(data.pagination.total);
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
    if (checkedAuth) load(statusFilter);
  }, [checkedAuth, statusFilter, load]);

  async function handleRemove(listingId: string) {
    if (!confirm('Bạn có chắc chắn muốn gỡ tin đăng này? Tin sau khi gỡ sẽ không hiển thị công khai.')) {
      return;
    }
    try {
      const res = await authFetch(`/listings/${listingId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Không thể gỡ tin đăng.');
      load(statusFilter);
    } catch (err) {
      alert((err as Error).message);
    }
  }

  if (!checkedAuth) return null;

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="container-max py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Quản lý tin đăng</h1>
            <p className="mt-0.5 text-sm text-text-muted">{total} tin trong tài khoản</p>
          </div>
          <Link href="/dang-tin" className="btn-primary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Đăng tin mới
          </Link>
        </div>

        {/* Filter tabs */}
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-brand text-white shadow-sm'
                  : 'bg-white text-text-secondary ring-1 ring-surface-border hover:ring-brand hover:text-brand'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div className="mt-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl skeleton" />
            ))}
          </div>
        )}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {listings.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-surface-border bg-white p-12 text-center">
                <span className="text-4xl">📃</span>
                <p className="mt-3 font-semibold text-text-primary">Chưa có tin nào ở trạng thái này</p>
                <Link href="/dang-tin" className="btn-primary mt-4 inline-flex">
                  Đăng tin đầu tiên
                </Link>
              </div>
            ) : (
              <div className="mt-4 divide-y divide-surface-border rounded-2xl border border-surface-border bg-white shadow-card overflow-hidden">
                {listings.map((listing) => {
                  const status = STATUS_LABEL[listing.status] ?? { label: listing.status, className: 'bg-gray-100 text-gray-600' };
                  return (
                    <div key={listing.id} className="flex items-center gap-4 p-4 hover:bg-surface-muted/50 transition-colors">
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                        {listing.images[0]?.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={listing.images[0].imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[10px] text-text-muted">
                            Chưa có ảnh
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-text-primary">{listing.title}</p>
                        <p className="text-sm text-text-muted">{listing.addressDetail ?? listing.location.name}</p>
                        <p className="text-sm font-bold text-brand">{formatPrice(listing.price)}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                        {status.label}
                      </span>
                      <div className="flex shrink-0 items-center gap-3">
                        {listing.status === 'active' && (
                          <Link
                            href={`/tin/${listing.slug}`}
                            className="text-sm font-medium text-brand hover:text-brand-700 transition-colors"
                          >
                            Xem
                          </Link>
                        )}
                        {listing.status !== 'removed' && (
                          <button
                            onClick={() => handleRemove(listing.id)}
                            className="text-sm font-medium text-red-600 hover:text-red-700 transition-colors"
                          >
                            Gỡ tin
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
