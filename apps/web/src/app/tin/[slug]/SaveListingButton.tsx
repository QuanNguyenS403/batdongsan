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
      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
        saved
          ? 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      <span className={saved ? 'text-red-500' : 'text-gray-400'}>{saved ? '❤️' : '🤍'}</span>
      <span>{saved ? 'Đã lưu tin' : 'Lưu tin'}</span>
    </button>
  );
}
