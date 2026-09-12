'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-client';
import { formatPrice } from '@/lib/api';

interface MembershipRequest {
  id: string;
  userId: string;
  planId: number;
  status: 'pending' | 'active' | 'rejected' | 'expired';
  pricePaid: string;
  startDate: string | null;
  endDate: string | null;
  paymentNote: string | null;
  createdAt: string;
  user: {
    id: string;
    phone: string;
    fullName: string | null;
    role: string;
  };
  plan: {
    id: number;
    name: string;
    code: string;
    durationDays: number;
    maxActiveListings: number;
  };
}

export default function AdminMembershipRequestsPage() {
  const [requests, setRequests] = useState<MembershipRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  async function loadRequests() {
    setLoading(true);
    try {
      const query = activeTab === 'pending' ? '?status=pending' : '';
      const res = await authFetch(`/admin/membership-requests${query}`);
      if (res.ok) {
        const data = await res.json();
        setRequests(data.items || []);
      }
    } catch {
      // safe-fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, [activeTab]);

  async function handleApprove(requestId: string, planName: string, userPhone: string) {
    if (!confirm(`Xác nhận bạn ĐÃ NHẬN ĐỦ TIỀN chuyển khoản và muốn KÍCH HOẠT gói "${planName}" cho SĐT ${userPhone}?`)) {
      return;
    }

    setActionLoading(requestId);
    setFeedback(null);
    try {
      const res = await authFetch(`/admin/membership-requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Không thể phê duyệt yêu cầu.');
      }

      setFeedback({
        type: 'success',
        message: `Đã kích hoạt thành công gói "${planName}" cho khách hàng ${userPhone}! Hạn mức tin đăng của họ đã được cập nhật.`,
      });
      loadRequests();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Đã có lỗi xảy ra.' });
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(requestId: string, userPhone: string) {
    const reason = prompt(`Nhập lý do từ chối yêu cầu của SĐT ${userPhone} (ví dụ: Sai số tiền, chưa nhận được chuyển khoản):`);
    if (reason === null) return; // bấm Hủy

    setActionLoading(requestId);
    setFeedback(null);
    try {
      const res = await authFetch(`/admin/membership-requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() || 'Chưa nhận được thanh toán' }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Không thể từ chối yêu cầu.');
      }

      setFeedback({
        type: 'success',
        message: `Đã từ chối yêu cầu của SĐT ${userPhone}.`,
      });
      loadRequests();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Đã có lỗi xảy ra.' });
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
          Duyệt Yêu Cầu Gói Thành Viên
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Đối soát sao kê ngân hàng và kích hoạt gói đăng tin cho chủ trọ / môi giới. Sau khi kích hoạt, hạn mức tin đăng của khách hàng sẽ tự động tăng tương ứng.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-2xl p-4 text-sm flex items-center justify-between shadow-sm animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{feedback.type === 'success' ? '✅' : '⚠️'}</span>
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'pending'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          ⏳ Chờ duyệt thanh toán
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'all'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          📋 Tất cả lịch sử yêu cầu
        </button>
      </div>

      {/* Bảng dữ liệu */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Đang tải danh sách yêu cầu...</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            {activeTab === 'pending'
              ? 'Hiện không có yêu cầu nâng cấp gói nào đang chờ duyệt. 🎉'
              : 'Chưa có lịch sử yêu cầu nào.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Khách hàng</th>
                  <th className="px-6 py-3.5">Gói đăng ký</th>
                  <th className="px-6 py-3.5">Số tiền cần thu</th>
                  <th className="px-6 py-3.5">Ghi chú thanh toán</th>
                  <th className="px-6 py-3.5">Thời gian gửi</th>
                  <th className="px-6 py-3.5">Trạng thái</th>
                  <th className="px-6 py-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {requests.map((item) => {
                  const isPending = item.status === 'pending';
                  const isActive = item.status === 'active';
                  const isRejected = item.status === 'rejected';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Khách hàng */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900 text-xs">
                          {item.user.fullName || 'Chưa cập nhật tên'}
                        </p>
                        <a
                          href={`tel:${item.user.phone}`}
                          className="text-[11px] text-teal-600 font-mono font-bold hover:underline"
                        >
                          📞 {item.user.phone}
                        </a>
                      </td>

                      {/* Gói đăng ký */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{item.plan.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Tối đa <strong>{item.plan.maxActiveListings} tin</strong> • {item.plan.durationDays} ngày
                        </p>
                      </td>

                      {/* Số tiền */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <strong className="text-rose-600 font-extrabold text-sm">
                          {formatPrice(item.pricePaid)}
                        </strong>
                      </td>

                      {/* Ghi chú chuyển khoản */}
                      <td className="px-6 py-4">
                        {item.paymentNote ? (
                          <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-[11px] text-slate-700 font-mono max-w-xs">
                            {item.paymentNote}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Không có ghi chú</span>
                        )}
                      </td>

                      {/* Thời gian */}
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500 text-[11px]">
                        {new Date(item.createdAt).toLocaleString('vi-VN')}
                      </td>

                      {/* Trạng thái */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            Chờ xác nhận
                          </span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Đã kích hoạt
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            Đã từ chối
                          </span>
                        )}
                      </td>

                      {/* Thao tác */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={actionLoading === item.id}
                              onClick={() => handleApprove(item.id, item.plan.name, item.user.phone)}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                            >
                              {actionLoading === item.id ? 'Đang duyệt...' : '✓ Xác nhận & Kích hoạt'}
                            </button>
                            <button
                              type="button"
                              disabled={actionLoading === item.id}
                              onClick={() => handleReject(item.id, item.user.phone)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-semibold text-xs rounded-xl transition-colors"
                            >
                              Từ chối
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Đã xử lý</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
