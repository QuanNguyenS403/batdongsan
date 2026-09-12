'use client';

import { useEffect, useState } from 'react';
import { authFetch, isLoggedIn } from '@/lib/auth-client';

interface RevealPhoneButtonProps {
  listingId: string;
  onPhoneRevealed?: (phone: string) => void;
  onRequireAuth?: () => void;
  autoRevealTrigger?: number;
}

export function RevealPhoneButton({
  listingId,
  onPhoneRevealed,
  onRequireAuth,
  autoRevealTrigger,
}: RevealPhoneButtonProps) {
  const [phone, setPhone] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoRevealTrigger && autoRevealTrigger > 0 && !phone && isLoggedIn()) {
      handleReveal();
    }
  }, [autoRevealTrigger]);

  async function handleReveal() {
    setError(null);
    if (listingId.startsWith('demo-')) {
      setError('Đây là tin mẫu thử nghiệm, không có số điện thoại thật.');
      return;
    }
    if (!isLoggedIn()) {
      if (onRequireAuth) {
        onRequireAuth();
      }
      return;
    }

    setLoading(true);
    try {
      const res = await authFetch(`/listings/${listingId}/reveal-phone`, { method: 'POST' });
      if (res.status === 401) {
        if (onRequireAuth) onRequireAuth();
        return;
      }
      if (!res.ok) throw new Error('Không lấy được số điện thoại.');
      const data = await res.json();
      setPhone(data.phone);
      if (onPhoneRevealed && data.phone) {
        onPhoneRevealed(data.phone);
      }
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
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-[0.99] transition-all"
      >
        <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
        </svg>
        <span>{phone}</span>
        <span className="text-xs font-normal opacity-90">• Gọi ngay</span>
      </a>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleReveal}
        disabled={loading}
        className="group flex w-full items-center justify-between rounded-xl border-2 border-emerald-600/80 bg-emerald-50/50 px-4 py-2.5 font-bold text-emerald-800 hover:bg-emerald-600 hover:text-white transition-all active:scale-[0.99]"
      >
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-emerald-600 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
          </svg>
          <span className="font-mono text-sm tracking-wide">09•• ••• •••</span>
        </div>
        <span className="text-xs font-semibold underline underline-offset-2">
          {loading ? 'Đang lấy số...' : 'Bấm để hiện số'}
        </span>
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
