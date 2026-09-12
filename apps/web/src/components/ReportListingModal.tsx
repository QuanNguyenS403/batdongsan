'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const REPORT_REASONS = [
  { value: 'sai_thong_tin', label: 'Sai thông tin (giá, diện tích, vị trí...)' },
  { value: 'tin_gia', label: 'Tin rác, tin đăng trùng lặp hoặc giả mạo' },
  { value: 'da_ban_cho_thue', label: 'Bất động sản đã bán hoặc đã cho thuê' },
  { value: 'lua_dao', label: 'Dấu hiệu lừa đảo, chiếm đoạt tiền cọc' },
  { value: 'khac', label: 'Lý do vi phạm khác' },
];

export function ReportListingModal({ listingId }: { listingId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('sai_thong_tin');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (listingId.startsWith('demo-')) {
      setError('Đây là tin mẫu thử nghiệm, không thể gửi báo cáo vi phạm.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/listings/${listingId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, note: note.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message?.toString() ?? 'Gửi báo cáo thất bại.');

      setSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
        setNote('');
      }, 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mt-4 pt-3 border-t border-surface-border flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-surface-border bg-surface-muted/60 px-3 py-1.5 text-xs font-medium text-text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <span>Báo vi phạm</span>
          <span className="text-amber-500">⚠️</span>
        </button>
        <span className="text-[11px] text-text-muted">Tin đăng được kiểm duyệt tự động</span>
      </div>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-fade-in rounded-2xl bg-white p-6 shadow-modal">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-text-primary">Báo cáo tin đăng vi phạm</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-text-muted hover:bg-slate-100 transition-colors"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {success ? (
              <div className="mt-4 rounded-2xl bg-green-50 p-5 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <p className="font-semibold text-green-800">Cảm ơn bạn đã gửi phản ánh!</p>
                <p className="mt-1 text-xs text-green-600">
                  Đội ngũ kiểm duyệt sẽ xem xét và xử lý tin đăng này trong thời gian sớm nhất.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Lý do báo cáo *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="filter-select"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Mô tả thêm (tuỳ chọn)</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả cụ thể vi phạm hoặc thông tin sai lệch..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="input-field resize-none"
                  />
                </div>

                {error && (
                  <p className="rounded-xl bg-red-50 px-3 py-2 text-xs text-red-600">{error}</p>
                )}

                <div className="flex items-center justify-end gap-2 border-t border-surface-border pt-3">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary text-xs px-4 py-2"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60 transition-colors active:scale-[0.98]"
                  >
                    {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
