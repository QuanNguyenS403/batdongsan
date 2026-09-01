'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export function RevealPhoneButton({ listingId }: { listingId: string }) {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReveal() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('Vui lòng đăng nhập để xem số điện thoại.');
        return;
      }

      const res = await fetch(`${API_URL}/listings/${listingId}/reveal-phone`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
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
