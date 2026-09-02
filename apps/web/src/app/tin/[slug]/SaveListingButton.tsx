'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, isLoggedIn } from '@/lib/auth-client';

export function SaveListingButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;

    authFetch(`/listings/${listingId}/is-saved`)
      .then((res) => (res.ok ? res.json() : { saved: false }))
      .then((data) => setSaved(data.saved))
      .catch(() => undefined);
  }, [listingId]);

  async function handleToggle() {
    if (!isLoggedIn()) {
      if (confirm('Vui lòng đăng nhập để lưu bất động sản vào danh sách yêu thích. Đến trang đăng nhập ngay?')) {
        router.push('/dang-nhap');
      }
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`/listings/${listingId}/save`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setSaved(data.saved);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all active:scale-95 ${
        saved
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-surface-border bg-white text-text-secondary hover:border-brand hover:text-brand'
      }`}
    >
      <svg
        className={`h-4 w-4 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'fill-none text-text-muted'}`}
        viewBox="0 0 24 24"
        strokeWidth={2}
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
      <span>{saved ? 'Đã lưu' : 'Lưu tin'}</span>
    </button>
  );
}
