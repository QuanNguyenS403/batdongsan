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
        className="btn-primary w-full justify-center"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
        {phone}
      </a>
    );
  }

  return (
    <div>
      <button
        onClick={handleReveal}
        disabled={loading}
        className="btn-primary w-full justify-center"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
        {loading ? 'Đang tải...' : 'Bấm để hiện số điện thoại'}
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
