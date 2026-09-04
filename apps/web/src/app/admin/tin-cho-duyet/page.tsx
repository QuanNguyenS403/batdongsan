'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-client';

interface ListingItem {
  id: string;
  title: string;
  slug: string;
  description: string;
  transactionType: string;
  propertyType: string;
  price: string;
  areaM2: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  legalStatus?: string | null;
  addressDetail?: string | null;
  status: string;
  createdAt: string;
  rejectionReason?: string | null;
  images: { imageUrl: string; sortOrder: number }[];
  location?: { name: string } | null;
  owner: { id: string; fullName: string | null; phone: string; avatarUrl?: string | null };
}

function formatPriceVND(priceStr: string): string {
  try {
    const price = BigInt(priceStr);
    if (price >= 1_000_000_000n) {
      const billions = Number(price) / 1_000_000_000;
      return `${billions.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`;
    }
    if (price >= 1_000_000n) {
      const millions = Number(price) / 1_000_000;
      return `${millions.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`;
    }
    return `${price.toLocaleString('vi-VN')} đ`;
  } catch {
    return priceStr;
  }
}

const PROPERTY_TYPE_NAMES: Record<string, string> = {
  can_ho: 'Căn hộ chung cư',
  nha_rieng: 'Nhà riêng',
  nha_pho: 'Nhà mặt phố',
  dat_nen: 'Đất nền',
  biet_thu: 'Biệt thự',
  kho_xuong: 'Kho xưởng',
  mat_bang: 'Mặt bằng kinh doanh',
  khac: 'BĐS khác',
};

const DEFAULT_REASONS = [
  'Hình ảnh mờ, chứa watermark hoặc không đúng thực tế',
  'Mức giá không hợp lý hoặc sai đơn vị định giá',
  'Nội dung có dấu hiệu lừa đảo / quảng cáo spam',
  'Tin đăng trùng lặp với tin đã tồn tại trên sàn',
  'Địa chỉ hoặc vị trí bất động sản không chính xác',
];

export default function AdminPendingListingsPage() {
  const [items, setItems] = useState<ListingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');

  // Modal Chi tiết
  const [selectedListing, setSelectedListing] = useState<ListingItem | null>(null);

  // Modal Từ chối
  const [rejectingListing, setRejectingListing] = useState<ListingItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Thông báo toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadListings();
  }, [page, statusFilter]);

  function showToast(text: string, type: 'success' | 'error' = 'success') {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  }

  async function loadListings(searchKeyword = keyword) {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: '10',
        status: statusFilter,
      });
      if (searchKeyword.trim()) {
        params.set('keyword', searchKeyword.trim());
      }

      const res = await authFetch(`/admin/listings/pending?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setTotal(data.pagination?.total ?? 0);
        setTotalPages(data.pagination?.totalPages ?? 1);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách tin:', err);
      showToast('Không thể tải danh sách tin đăng', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    loadListings(keyword);
  }

  async function handleApprove(id: string) {
    if (!confirm('Xác nhận phê duyệt tin đăng này lên sàn?')) return;
    setSubmittingAction(true);
    try {
      const res = await authFetch(`/admin/listings/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        showToast('✅ Đã phê duyệt tin đăng thành công! Tin đã xuất hiện công khai.');
        if (selectedListing?.id === id) setSelectedListing(null);
        loadListings();
      } else {
        const err = await res.json();
        showToast(err.message ?? 'Không thể duyệt tin', 'error');
      }
    } catch {
      showToast('Có lỗi xảy ra trong quá trình duyệt tin', 'error');
    } finally {
      setSubmittingAction(false);
    }
  }

  async function handleConfirmReject() {
    if (!rejectingListing) return;
    const finalReason = customReason.trim() || rejectReason;
    if (!finalReason) {
      alert('Vui lòng chọn hoặc nhập lý do từ chối.');
      return;
    }

    setSubmittingAction(true);
    try {
      const res = await authFetch(`/admin/listings/${rejectingListing.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: finalReason }),
      });

      if (res.ok) {
        showToast('Đã từ chối tin đăng và thông báo lý do.');
        setRejectingListing(null);
        setRejectReason('');
        setCustomReason('');
        if (selectedListing?.id === rejectingListing.id) setSelectedListing(null);
        loadListings();
      } else {
        const err = await res.json();
        showToast(err.message ?? 'Không thể từ chối tin', 'error');
      }
    } catch {
      showToast('Có lỗi xảy ra khi từ chối tin', 'error');
    } finally {
      setSubmittingAction(false);
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast thông báo */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl border text-sm font-semibold flex items-center gap-3 transition-all transform translate-y-0 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          <span>{toastMessage.text}</span>
          <button onClick={() => setToastMessage(null)} className="opacity-80 hover:opacity-100 text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Header và Bộ lọc */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kiểm duyệt Tin đăng</h1>
          <p className="text-sm text-slate-500 mt-1">
            Xem xét, đối chiếu thông tin và phê duyệt tin trước khi hiển thị cho người mua/thuê.
          </p>
        </div>

        {/* Tab Trạng thái */}
        <div className="flex bg-slate-200/70 p-1 rounded-xl text-xs font-semibold self-start">
          <button
            onClick={() => {
              setStatusFilter('pending');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg transition-all ${
              statusFilter === 'pending'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chờ duyệt ({statusFilter === 'pending' ? total : '...'})
          </button>
          <button
            onClick={() => {
              setStatusFilter('active');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg transition-all ${
              statusFilter === 'active'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã duyệt
          </button>
          <button
            onClick={() => {
              setStatusFilter('rejected');
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg transition-all ${
              statusFilter === 'rejected'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã từ chối
          </button>
        </div>
      </div>

      {/* Thanh tìm kiếm */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <svg
            className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm theo tiêu đề tin, số điện thoại hoặc họ tên người đăng..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 shadow-sm"
          />
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-medium text-sm rounded-xl transition-colors shadow-sm"
        >
          Tìm kiếm
        </button>
      </form>

      {/* Danh sách tin */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🎉
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">
            {statusFilter === 'pending'
              ? 'Không có tin đăng nào cần duyệt'
              : 'Không tìm thấy tin đăng phù hợp'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {statusFilter === 'pending'
              ? 'Toàn bộ tin đăng đã được xử lý. Khi có thành viên đăng tin mới, hệ thống sẽ tự động cập nhật vào đây.'
              : 'Thử điều chỉnh từ khóa tìm kiếm hoặc chuyển sang bộ lọc khác.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((listing) => (
            <div
              key={listing.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 flex flex-col md:flex-row gap-5"
            >
              {/* Ảnh đại diện */}
              <div
                onClick={() => setSelectedListing(listing)}
                className="w-full md:w-56 h-40 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0 relative cursor-pointer group"
              >
                {listing.images?.[0]?.imageUrl ? (
                  <img
                    src={listing.images[0].imageUrl}
                    alt={listing.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    Chưa có ảnh
                  </div>
                )}
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-slate-900/70 text-white backdrop-blur-sm">
                  {listing.transactionType === 'ban' ? 'Bán' : 'Cho thuê'}
                </div>
                <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[11px] font-bold bg-black/60 text-white backdrop-blur-sm">
                  📷 {listing.images?.length ?? 0} ảnh
                </div>
              </div>

              {/* Thông tin chính */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
                      {PROPERTY_TYPE_NAMES[listing.propertyType] ?? listing.propertyType}
                    </span>
                    <span className="text-xs text-slate-400">
                      Mã tin: #{listing.id}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-400">
                      Gửi lúc: {new Date(listing.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>

                  <h2
                    onClick={() => setSelectedListing(listing)}
                    className="text-base font-bold text-slate-900 hover:text-teal-600 transition-colors cursor-pointer line-clamp-2"
                  >
                    {listing.title}
                  </h2>

                  <div className="mt-2 flex items-baseline gap-4 flex-wrap">
                    <span className="text-lg font-extrabold text-teal-600">
                      {formatPriceVND(listing.price)}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      📐 {listing.areaM2} m²
                    </span>
                    {listing.bedrooms && (
                      <span className="text-xs text-slate-600">🛏️ {listing.bedrooms} PN</span>
                    )}
                    {listing.bathrooms && (
                      <span className="text-xs text-slate-600">🚿 {listing.bathrooms} WC</span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">
                    📍 {listing.addressDetail ? `${listing.addressDetail}, ` : ''}{listing.location?.name ?? 'Chưa xác định'}
                  </p>

                  {listing.rejectionReason && (
                    <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700">
                      <strong>Lý do từ chối trước đó:</strong> {listing.rejectionReason}
                    </div>
                  )}
                </div>

                {/* Khối người đăng + Nút hành động */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs text-slate-600">
                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-700">
                      {(listing.owner.fullName ?? listing.owner.phone).charAt(0).toUpperCase()}
                    </div>
                    <span>
                      Người đăng: <strong className="text-slate-800">{listing.owner.fullName ?? 'Chưa đặt tên'}</strong>
                    </span>
                    <span className="text-slate-400">•</span>
                    <span className="font-mono font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      📞 {listing.owner.phone}
                    </span>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedListing(listing)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      Xem chi tiết
                    </button>

                    {listing.status === 'pending' && (
                      <>
                        <button
                          disabled={submittingAction}
                          onClick={() => {
                            setRejectingListing(listing);
                            setRejectReason(DEFAULT_REASONS[0]);
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          Từ chối
                        </button>
                        <button
                          disabled={submittingAction}
                          onClick={() => handleApprove(listing.id)}
                          className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <span>Duyệt tin</span>
                          <span>✓</span>
                        </button>
                      </>
                    )}

                    {listing.status === 'active' && (
                      <span className="px-3 py-1 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
                        Đang hiển thị
                      </span>
                    )}

                    {listing.status === 'rejected' && (
                      <button
                        onClick={() => handleApprove(listing.id)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors"
                      >
                        Duyệt lại
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Phân trang */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-slate-500">
                Hiển thị trang {page} trên {totalPages} (tổng số {total} tin)
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  ← Trang trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Trang sau →
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: XEM CHI TIẾT TIN ĐẦY ĐỦ */}
      {selectedListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
                  Xem chi tiết tin đăng #{selectedListing.id}
                </span>
                <h3 className="text-lg font-bold text-slate-900 line-clamp-1">
                  {selectedListing.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedListing(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Hình ảnh */}
              {selectedListing.images && selectedListing.images.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Hình ảnh đính kèm ({selectedListing.images.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedListing.images.map((img, idx) => (
                      <div key={idx} className="h-32 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                        <img
                          src={img.imageUrl}
                          alt={`Ảnh ${idx + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Thông số cốt lõi */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-xs text-slate-400">Mức giá:</span>
                  <p className="text-base font-bold text-teal-600">
                    {formatPriceVND(selectedListing.price)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Diện tích:</span>
                  <p className="text-base font-bold text-slate-800">
                    {selectedListing.areaM2} m²
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Phòng ngủ / WC:</span>
                  <p className="text-base font-bold text-slate-800">
                    {selectedListing.bedrooms ?? 0} PN / {selectedListing.bathrooms ?? 0} WC
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-400">Pháp lý:</span>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedListing.legalStatus ?? 'Chưa rõ'}
                  </p>
                </div>
              </div>

              {/* Địa chỉ */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Địa chỉ bất động sản
                </h4>
                <p className="text-sm text-slate-800">
                  {selectedListing.addressDetail ? `${selectedListing.addressDetail}, ` : ''}
                  {selectedListing.location?.name ?? 'Chưa gắn vị trí'}
                </p>
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Nội dung mô tả của người đăng
                </h4>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {selectedListing.description}
                </div>
              </div>

              {/* Người đăng */}
              <div className="p-4 bg-teal-50/60 border border-teal-100 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs text-teal-800 font-semibold">Chủ tin đăng:</span>
                  <p className="text-sm font-bold text-slate-900">
                    {selectedListing.owner.fullName ?? 'Chưa cập nhật tên'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-teal-800 font-semibold">Số điện thoại liên hệ:</span>
                  <p className="text-sm font-mono font-extrabold text-teal-800">
                    {selectedListing.owner.phone}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedListing(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl transition-colors"
              >
                Đóng lại
              </button>

              {selectedListing.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setRejectingListing(selectedListing);
                      setRejectReason(DEFAULT_REASONS[0]);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 rounded-xl transition-colors"
                  >
                    Từ chối tin này
                  </button>
                  <button
                    onClick={() => handleApprove(selectedListing.id)}
                    className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors"
                  >
                    Phê duyệt ngay
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: TỪ CHỐI DUYỆT TIN */}
      {rejectingListing && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Từ chối duyệt tin: "#{rejectingListing.id}"
              </h3>
              <button
                onClick={() => setRejectingListing(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Vui lòng chọn hoặc nhập lý do từ chối. Lý do này sẽ được ghi nhận để người đăng tin biết nguyên nhân và chỉnh sửa lại:
            </p>

            <div className="space-y-2">
              {DEFAULT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                    rejectReason === reason && !customReason
                      ? 'bg-rose-50 border-rose-300 text-rose-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    checked={rejectReason === reason && !customReason}
                    onChange={() => {
                      setRejectReason(reason);
                      setCustomReason('');
                    }}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Hoặc nhập lý do khác:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Nhập lý do cụ thể gửi tới người đăng tin..."
                rows={3}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingListing(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                disabled={submittingAction}
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-colors disabled:opacity-50"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
