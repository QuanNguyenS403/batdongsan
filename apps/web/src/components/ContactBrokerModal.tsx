'use client';

import { useState } from 'react';

interface ContactBrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId?: string;
  listingTitle?: string;
}

export function ContactBrokerModal({
  isOpen,
  onClose,
  listingId,
  listingTitle,
}: ContactBrokerModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(
    'Tôi quan tâm tới bất động sản này. Làm ơn liên lạc lại với tôi, cảm ơn!',
  );
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Giả lập gửi thông tin liên hệ thành công
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 2000);
    }, 500);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header chuẩn Ảnh 2 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-medium text-slate-800">Liên hệ môi giới</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Nội dung form chuẩn Ảnh 2 */}
        {submitted ? (
          <div className="p-8 text-center space-y-2">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-slate-900">Đã gửi liên hệ thành công!</h3>
            <p className="text-xs text-slate-500">
              Người đăng tin sẽ sớm liên lạc lại với bạn qua số điện thoại đã cung cấp.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
            {/* Họ & Tên */}
            <div>
              <input
                type="text"
                required
                placeholder="Họ & Tên"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#58cca9] focus:outline-none focus:ring-1 focus:ring-[#58cca9]"
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <input
                type="tel"
                required
                placeholder="Số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#58cca9] focus:outline-none focus:ring-1 focus:ring-[#58cca9]"
              />
            </div>

            {/* Email */}
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#58cca9] focus:outline-none focus:ring-1 focus:ring-[#58cca9]"
              />
            </div>

            {/* Lời nhắn */}
            <div>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-y rounded-md border border-slate-300 p-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#58cca9] focus:outline-none focus:ring-1 focus:ring-[#58cca9]"
              />
            </div>

            {/* Hai nút hành động Gửi và Bỏ qua chuẩn Ảnh 2 */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[#58cca9] px-7 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#48bfa9] transition-colors disabled:opacity-60"
              >
                {loading ? 'Đang gửi...' : 'Gửi'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[#58cca9] bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Bỏ qua
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
