'use client';

import { useState } from 'react';
import { authFetch, isLoggedIn } from '@/lib/auth-client';

export function RevealPhoneButton({ listingId }: { listingId: string }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReveal() {
    setLoading(true);
    setError(null);
    try {
      if (!isLoggedIn()) {
        setError('Vui lòng đăng nhập để xem số điện thoại.');
        return;
      }

      // authFetch tự thử làm mới access token (nếu đã hết hạn sau 15 phút) trước khi coi là
      // hết phiên — xem giải thích đầy đủ về lỗi trước đây trong lib/auth-client.ts.
      const res = await authFetch(`/listings/${listingId}/reveal-phone`, { method: 'POST' });
      if (res.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }
      if (!res.ok) throw new Error('Không lấy được số điện thoại.');
      const data = await res.json();
      setPhone(data.phone);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (phone) {
    return (
      <a
        href={`tel:${phone}`}
        className="mt-4 block w-full rounded-full bg-brand py-2.5 text-center text-sm font-semibold text-gray-900"
      >
        📞 {phone}
      </a>
    );
  }

  return (
    <div className="mt-4">
      <button
        onClick={handleReveal}
        disabled={loading}
        className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? 'Đang tải...' : '📞 Bấm để hiện số'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
