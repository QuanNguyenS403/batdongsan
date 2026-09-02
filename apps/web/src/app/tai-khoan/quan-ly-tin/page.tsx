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

  if (!checkedAuth) return null; // tránh nháy nội dung trước khi kịp kiểm tra đăng nhập + redirect

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý tin đăng của tôi</h1>
        <Link
          href="/dang-tin"
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-brand-dark"
        >
          + Đăng tin mới
        </Link>
      </div>

      <div className="mt-4 flex gap-2 overflow-x-auto border-b pb-2">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium ${
              statusFilter === tab.value ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-sm text-gray-500">Đang tải...</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {!loading && !error && (
        <>
          <p className="mt-4 text-sm text-gray-500">{total} tin đăng phù hợp bộ lọc</p>

          {listings.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed p-10 text-center text-sm text-gray-500">
              Chưa có tin đăng nào ở trạng thái này.{' '}
              <Link href="/dang-tin" className="font-semibold text-brand-dark underline">
                Đăng tin đầu tiên
              </Link>
              .
            </div>
          ) : (
            <div className="mt-4 divide-y rounded-xl border bg-white">
              {listings.map((listing) => {
                const status = STATUS_LABEL[listing.status] ?? { label: listing.status, className: 'bg-gray-100 text-gray-600' };
                return (
                  <div key={listing.id} className="flex items-center gap-4 p-4">
                    <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                      {listing.images[0]?.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={listing.images[0].imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-[10px] text-gray-400">Chưa có ảnh</div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-gray-900">{listing.title}</p>
                      <p className="text-sm text-gray-500">{listing.addressDetail ?? listing.location.name}</p>
                      <p className="text-sm font-semibold text-brand-dark">{formatPrice(listing.price)}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${status.className}`}>
                      {status.label}
                    </span>
                    <div className="flex shrink-0 items-center gap-3">
                      {listing.status === 'active' && (
                        <Link href={`/tin/${listing.slug}`} className="text-sm font-medium text-brand-dark hover:underline">
                          Xem tin
                        </Link>
                      )}
                      {listing.status !== 'removed' && (
                        <button
                          onClick={() => handleRemove(listing.id)}
                          className="text-sm font-medium text-red-600 hover:underline"
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
  );
}
