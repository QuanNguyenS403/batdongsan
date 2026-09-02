'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const REPORT_REASONS = [
  { value: 'spam', label: 'Tin rác, tin đăng trùng lặp' },
  { value: 'wrong_info', label: 'Sai thông tin (giá, diện tích, vị trí...)' },
  { value: 'sold', label: 'Bất động sản đã bán hoặc đã cho thuê' },
  { value: 'fraud', label: 'Dấu hiệu lừa đảo, giả mạo' },
  { value: 'other', label: 'Lý do khác' },
];

export function ReportListingModal({ listingId }: { listingId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('wrong_info');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
    <div className="mt-6 border-t pt-4">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"
      >
        <span>🚩</span> Báo cáo tin vi phạm / thông tin sai lệch
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Báo cáo tin đăng vi phạm</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {success ? (
              <div className="mt-4 rounded-xl bg-green-50 p-4 text-center text-sm text-green-700">
                <p className="font-semibold">Cảm ơn bạn đã gửi phản ánh!</p>
                <p className="mt-1 text-xs text-green-600">
                  Đội ngũ kiểm duyệt sẽ xem xét và xử lý tin đăng này trong thời gian sớm nhất.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Lý do báo cáo *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
                  >
                    {REPORT_REASONS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Mô tả thêm (tuỳ chọn)</label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả cụ thể vi phạm hoặc thông tin sai lệch..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
                  />
                </div>

                {error && <p className="text-xs text-red-600">{error}</p>}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
                  >
                    Huỷ
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
                  >
                    {loading ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
