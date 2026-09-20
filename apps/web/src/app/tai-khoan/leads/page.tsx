'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authFetch, isLoggedIn } from '@/lib/auth-client';

interface SellerLead {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  message: string | null;
  channel: string;
  status: string;
  createdAt: string;
  notes: string | null;
  listing?: {
    id: string;
    title: string;
    slug: string;
    price: string | null;
  };
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: 'Khách mới', color: 'bg-emerald-100 text-emerald-800' },
  contacted: { label: 'Đã liên hệ', color: 'bg-blue-100 text-blue-800' },
  qualified: { label: 'Hẹn xem phòng', color: 'bg-purple-100 text-purple-800' },
  completed: { label: 'Đã thuê xong', color: 'bg-teal-100 text-teal-800' },
  spam: { label: 'Spam / Không nhu cầu', color: 'bg-gray-100 text-gray-700' },
};

export default function MyLeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<SellerLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.push('/dang-nhap');
      return;
    }

    async function loadMyLeads() {
      setLoading(true);
      try {
        const res = await authFetch(`/leads/mine?page=${page}&pageSize=20`);
        if (!res.ok) throw new Error('Không thể tải danh sách liên hệ');
        const data = await res.json();
        setLeads(data.items || []);
        setTotal(data.pagination?.total || 0);
        setTotalPages(data.pagination?.totalPages || 1);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadMyLeads();
  }, [page, router]);

  async function handleStatusChange(id: string, newStatus: string) {
    setUpdatingId(id);
    try {
      const res = await authFetch(`/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setLeads((prev) =>
          prev.map((lead) => (lead.id === id ? { ...lead, status: newStatus } : lead)),
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-surface-muted py-8">
      <div className="container-max">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-text-muted">
          <Link href="/" className="hover:text-brand transition-colors">Trang chủ</Link>
          <span>›</span>
          <span className="text-text-secondary font-medium">Khách thuê liên hệ</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">Khách thuê liên hệ trực tiếp</h1>
            <p className="text-sm text-text-muted mt-1">
              Bạn có <span className="font-semibold text-brand">{total}</span> khách thuê đã để lại thông tin liên hệ cho các phòng của bạn.
            </p>
          </div>
          <Link
            href="/tai-khoan/quan-ly-tin"
            className="inline-flex items-center gap-2 rounded-xl border border-surface-border bg-white px-4 py-2 text-sm font-semibold text-text-secondary hover:border-brand hover:text-brand transition-colors shadow-sm"
          >
            ← Về Quản lý tin
          </Link>
        </div>

        {/* Danh sách leads */}
        <div className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-surface-border bg-white p-12 text-center text-sm text-text-muted">
              Đang tải danh sách khách liên hệ...
            </div>
          ) : leads.length === 0 ? (
            <div className="rounded-2xl border border-surface-border bg-white p-12 text-center">
              <span className="text-4xl">📬</span>
              <p className="mt-3 font-semibold text-text-primary">Chưa có khách thuê nào để lại liên hệ</p>
              <p className="mt-1 text-xs text-text-secondary">
                Khi khách hàng xem tin của bạn và bấm "Liên hệ môi giới / chủ trọ", thông tin của họ sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            leads.map((lead) => {
              const statusInfo = STATUS_LABELS[lead.status] || {
                label: lead.status,
                color: 'bg-gray-100 text-gray-800',
              };
              return (
                <div
                  key={lead.id}
                  className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <span className="text-base font-bold text-text-primary">{lead.fullName}</span>
                      <span className="ml-2 text-xs text-text-muted font-normal">
                        ({new Date(lead.createdAt).toLocaleString('vi-VN')})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">Trạng thái:</span>
                      <select
                        value={lead.status}
                        disabled={updatingId === lead.id}
                        onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                        className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-colors cursor-pointer ${statusInfo.color}`}
                      >
                        <option value="new">Khách mới</option>
                        <option value="contacted">Đã liên hệ</option>
                        <option value="qualified">Hẹn xem phòng</option>
                        <option value="completed">Đã thuê xong</option>
                        <option value="spam">Spam / Hủy</option>
                      </select>
                    </div>
                  </div>

                  {lead.listing && (
                    <div className="text-xs text-text-secondary">
                      <span>Phòng quan tâm: </span>
                      <Link
                        href={`/tin/${lead.listing.slug}`}
                        target="_blank"
                        className="font-semibold text-brand hover:underline"
                      >
                        {lead.listing.title}
                      </Link>
                    </div>
                  )}

                  {lead.message && (
                    <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 italic border border-slate-200/60">
                      "{lead.message}"
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-1">
                    <a
                      href={`tel:${lead.phone}`}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors shadow-sm"
                    >
                      <span>📞 Gọi ngay:</span>
                      <span className="font-mono font-bold">{lead.phone}</span>
                    </a>
                    {lead.email && (
                      <a
                        href={`mailto:${lead.email}`}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        ✉️ Gửi Email
                      </a>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* Phân trang (FE-N08) */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between rounded-2xl border border-surface-border bg-white px-6 py-4 shadow-sm">
              <p className="text-xs text-text-muted">
                Hiển thị trang <strong>{page}</strong> / <strong>{totalPages}</strong> (tổng số {total} khách liên hệ)
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
        </div>
      </div>
    </div>
  );
}
