'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-client';
import { formatExactPrice } from '@/lib/api';

interface ServiceDrivers {
  email: { isMock: boolean; driver: string };
  googleSheets: { isMock: boolean; driver: string };
}

interface Stats {
  pendingListingsCount: number;
  newReportsCount: number;
  activeListingsCount: number;
  totalUsersCount: number;
}

interface FinanceSummary {
  confirmedCashIn: number;
  refundsPaid: number;
  netCashIn: number;
  cashInCount: number;
  refundCount: number;
  pendingOrdersCount: number;
  pendingQuotedTotal: number;
  operationalCosts: string;
}

interface RecentPendingListing {
  id: string;
  title: string;
  slug: string;
  price: string;
  areaM2: number;
  transactionType: string;
  propertyType: string;
  createdAt: string;
  images: { imageUrl: string }[];
  owner: { id: string; fullName: string | null; phone: string };
  location: { name: string } | null;
}

interface RecentReport {
  id: string;
  reason: string;
  note: string | null;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    slug: string;
    owner: { fullName: string | null; phone: string };
  };
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

const REASON_LABELS: Record<string, string> = {
  tin_gia: 'Tin giả mạo',
  lua_dao: 'Lừa đảo',
  sai_thong_tin: 'Sai thông tin',
  da_ban_cho_thue: 'Đã bán / Cho thuê',
  khac: 'Khác',
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [serviceDrivers, setServiceDrivers] = useState<ServiceDrivers | null>(null);
  const [financeSummary, setFinanceSummary] = useState<FinanceSummary | null>(null);
  const [recentListings, setRecentListings] = useState<RecentPendingListing[]>([]);
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [sweeping, setSweeping] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      const [resDash, resFin] = await Promise.all([
        authFetch('/admin/dashboard'),
        authFetch('/admin/finance/summary'),
      ]);

      if (resDash.ok) {
        const data = await resDash.json();
        setStats(data.stats);
        setServiceDrivers(data.serviceDrivers ?? null);
        setRecentListings(data.recentPendingListings ?? []);
        setRecentReports(data.recentReports ?? []);
      }

      if (resFin.ok) {
        const dataFin = await resFin.json();
        setFinanceSummary(dataFin);
      }
    } catch (err) {
      console.error('Lỗi khi tải dữ liệu dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleQuickApprove(id: string) {
    if (!confirm('Bạn có chắc muốn duyệt ngay tin đăng này?')) return;
    try {
      const res = await authFetch(`/admin/listings/${id}/approve`, { method: 'POST' });
      if (res.ok) {
        setActionMessage('Đã duyệt tin đăng thành công!');
        setTimeout(() => setActionMessage(null), 3000);
        loadDashboard();
      }
    } catch {
      alert('Có lỗi xảy ra khi duyệt tin.');
    }
  }

  async function handleRunSweep() {
    setSweeping(true);
    try {
      const res = await authFetch('/admin/tasks/run-sweep', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setActionMessage(data.message ?? 'Đã hoàn tất quét dọn hệ thống.');
        setTimeout(() => setActionMessage(null), 6000);
        loadDashboard();
      } else {
        alert('Không thể thực hiện quét dọn.');
      }
    } catch {
      alert('Lỗi kết nối máy chủ khi quét dọn.');
    } finally {
      setSweeping(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 animate-pulse p-6" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Tiêu đề trang & Các nút hành động */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tổng quan Hệ thống</h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi tình trạng tin đăng, báo cáo vi phạm và số lượng người dùng theo thời gian thực.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRunSweep}
            disabled={sweeping}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-teal-700 bg-teal-50 border border-teal-200 rounded-xl hover:bg-teal-100 transition-colors disabled:opacity-50"
            title="Quét dọn các tin quá hạn 30 ngày và thu hồi bộ nhớ OTP"
          >
            <span>🧹</span>
            <span>{sweeping ? 'Đang quét...' : 'Quét dọn tin quá hạn & OTP'}</span>
          </button>
          <button
            onClick={loadDashboard}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 shadow-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới số liệu
          </button>
        </div>
      </div>

      {/* Cảnh báo chế độ tích hợp (MOCK / LIVE) */}
      {(serviceDrivers?.email?.isMock || serviceDrivers?.googleSheets?.isMock) && (
        <div className="p-4 bg-amber-50/90 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-bold text-amber-950 text-sm">
                Thông báo Vận hành: Dịch vụ thông báo & đồng bộ đang chạy ở chế độ MOCK (Thử nghiệm)
              </p>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                {serviceDrivers?.email?.isMock && '• Email SMTP đang MOCK (các thông báo duyệt tin, từ chối tin và cảnh báo hết hạn chỉ in ra console máy chủ, chưa gửi email thật). '}
                {serviceDrivers?.googleSheets?.isMock && '• Google Sheets API đang MOCK (dữ liệu tin chờ duyệt và báo cáo chỉ log ra console, chưa đồng bộ vào Google Drive). '}
                Để kích hoạt gửi thật, vui lòng cấu hình <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">SMTP_HOST/USER/PASS</code> và <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">GOOGLE_SHEETS_CREDENTIALS_JSON</code> trong file <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">.env</code>.
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold px-2.5 py-1 bg-amber-200/70 text-amber-900 rounded-lg text-[11px] uppercase tracking-wider">
            Mock Mode
          </span>
        </div>
      )}

      {actionMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-sm font-medium flex items-center gap-2">
          <span>✅</span>
          <span>{actionMessage}</span>
        </div>
      )}

      {/* AF-10: Khối Dòng tiền Sổ cái Tài chính (Truth from FinanceLedger) */}
      {financeSummary && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Sổ Cái Dòng Tiền Thực Thu (Finance Ledger)
            </h2>
            <Link
              href="/admin/duyet-goi"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Chi tiết giao dịch & đối soát →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Tiền thực thu</span>
              <p className="text-2xl font-extrabold text-emerald-700 font-mono mt-1">
                {formatExactPrice(financeSummary.confirmedCashIn)}
              </p>
              <p className="text-[11px] text-emerald-600 mt-1">{financeSummary.cashInCount} giao dịch xác nhận</p>
            </div>

            <div className="bg-teal-50/70 border border-teal-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-teal-800 uppercase tracking-wider">Doanh thu thuần</span>
              <p className="text-2xl font-extrabold text-teal-800 font-mono mt-1">
                {formatExactPrice(financeSummary.netCashIn)}
              </p>
              <p className="text-[11px] text-teal-600 mt-1">Đã trừ {formatExactPrice(financeSummary.refundsPaid)} tiền hoàn</p>
            </div>

            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Chờ thanh toán</span>
              <p className="text-2xl font-extrabold text-amber-700 font-mono mt-1">
                {formatExactPrice(financeSummary.pendingQuotedTotal)}
              </p>
              <p className="text-[11px] text-amber-600 mt-1">⚠️ Chưa phải doanh thu ({financeSummary.pendingOrdersCount} đơn)</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Chi phí vận hành</span>
              <p className="text-sm font-bold text-slate-700 mt-2">
                {financeSummary.operationalCosts}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Báo cáo trung thực theo AF-10</p>
            </div>
          </div>
        </div>
      )}

      {/* 4 Thẻ chỉ số chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Thẻ: Tin chờ duyệt */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tin chờ duyệt
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.pendingListingsCount ?? 0}
            </span>
            <span className="text-xs text-amber-600 font-medium">tin cần xử lý</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/admin/tin-cho-duyet"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Vào duyệt ngay →
            </Link>
          </div>
        </div>

        {/* Thẻ: Báo cáo vi phạm */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Báo cáo vi phạm
            </span>
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.newReportsCount ?? 0}
            </span>
            <span className="text-xs text-rose-600 font-medium">báo cáo chưa duyệt</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/admin/bao-cao-vi-pham"
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
            >
              Xem báo cáo →
            </Link>
          </div>
        </div>

        {/* Thẻ: Tin đang hoạt động */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tin đang công khai
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.activeListingsCount ?? 0}
            </span>
            <span className="text-xs text-emerald-600 font-medium">tin trên sàn</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/thue"
              target="_blank"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              Xem trên sàn ↗
            </Link>
          </div>
        </div>

        {/* Thẻ: Tổng người dùng */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Tổng tài khoản
            </span>
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {stats?.totalUsersCount ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">thành viên</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-100">
            <Link
              href="/admin/nguoi-dung"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              Quản lý tài khoản →
            </Link>
          </div>
        </div>
      </div>

      {/* 2 Cột: Tin chờ duyệt gần nhất & Báo cáo mới nhất */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Cột trái: Tin chờ duyệt mới nhất */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">Tin đăng chờ duyệt gần đây</span>
              {recentListings.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                  {recentListings.length}
                </span>
              )}
            </div>
            <Link
              href="/admin/tin-cho-duyet"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentListings.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-3xl mb-2">🎉</p>
                <p className="text-sm font-semibold text-slate-700">Không có tin nào chờ duyệt</p>
                <p className="text-xs text-slate-400 mt-1">Toàn bộ tin đăng mới đều đã được xử lý.</p>
              </div>
            ) : (
              recentListings.map((item) => (
                <div key={item.id} className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50/60 transition-colors">
                  <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {item.images?.[0]?.imageUrl ? (
                      <img
                        src={item.images[0].imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                        No img
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-slate-900 truncate">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {(() => {
                        const isRoom =
                          item.propertyType === 'phong_tro' ||
                          item.propertyType === 'phong-tro' ||
                          item.propertyType === 'phong-tro-sinh-vien' ||
                          item.propertyType === 'ky_tuc_xa' ||
                          item.propertyType === 'can_ho_mini';
                        const isCommercial =
                          item.propertyType === 'mat_bang' ||
                          item.propertyType === 'mat-bang' ||
                          item.propertyType === 'mat-bang-kinh-doanh' ||
                          item.propertyType === 'cua_hang' ||
                          item.propertyType === 'kho_xuong' ||
                          item.propertyType === 'shophouse';

                        const label = isRoom
                          ? 'Thuê trọ'
                          : isCommercial
                          ? 'Mặt bằng'
                          : 'Căn hộ / Nhà';
                        const color = isRoom
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : isCommercial
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : 'bg-teal-50 text-teal-700 border-teal-200';

                        return (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${color}`}>
                            {label}
                          </span>
                        );
                      })()}
                      <span className="text-xs text-teal-600 font-bold">
                        {formatPriceVND(item.price)} • {item.areaM2} m²
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Người đăng: {item.owner.fullName ?? item.owner.phone} ({item.owner.phone})
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleQuickApprove(item.id)}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors"
                      title="Duyệt nhanh"
                    >
                      Duyệt
                    </button>
                    <Link
                      href={`/admin/tin-cho-duyet`}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Chi tiết
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cột phải: Báo cáo vi phạm mới nhất */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-slate-900">Báo cáo vi phạm mới</span>
              {recentReports.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 rounded-full">
                  {recentReports.length}
                </span>
              )}
            </div>
            <Link
              href="/admin/bao-cao-vi-pham"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              Xem tất cả
            </Link>
          </div>

          <div className="divide-y divide-slate-100 flex-1">
            {recentReports.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-3xl mb-2">🛡️</p>
                <p className="text-sm font-semibold text-slate-700">Không có báo cáo vi phạm mới</p>
                <p className="text-xs text-slate-400 mt-1">Hệ thống đang hoạt động an toàn và minh bạch.</p>
              </div>
            ) : (
              recentReports.map((rep) => (
                <div key={rep.id} className="p-4 sm:p-5 flex items-start gap-3 hover:bg-slate-50/60 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 text-sm">
                    🚩
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[11px] font-bold rounded">
                        {REASON_LABELS[rep.reason] ?? rep.reason}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(rep.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-800 mt-1 truncate">
                      Tin: {rep.listing.title}
                    </p>
                    {rep.note && (
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1 italic">
                        "{rep.note}"
                      </p>
                    )}
                  </div>
                  <Link
                    href="/admin/bao-cao-vi-pham"
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold shrink-0 transition-colors"
                  >
                    Xử lý
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
