'use client';

import { useState } from 'react';

interface ContactBrokerModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId?: string | number;
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
  const [consent, setConsent] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    // Kiểm tra tin đăng demo hoặc thiếu listingId (P0-04 / P0-02)
    const rawId = listingId ? String(listingId) : '';
    if (!rawId || rawId.startsWith('demo-')) {
      setErrorMessage(
        'Đây là dữ liệu mẫu thử nghiệm hoặc tin chưa kích hoạt. Không thể gửi yêu cầu liên hệ thật.',
      );
      return;
    }

    // Validate định dạng số điện thoại di động Việt Nam (10 số, đầu 03, 05, 07, 08, 09)
    const cleanPhone = phone.replace(/\s+/g, '');
    const phoneRegex = /^(03|05|07|08|09)\d{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMessage(
        'Số điện thoại không hợp lệ. Vui lòng nhập số di động 10 chữ số (bắt đầu bằng 03, 05, 07, 08, 09).',
      );
      return;
    }

    if (!consent) {
      setErrorMessage(
        'Bạn cần đồng ý chia sẻ thông tin liên hệ để người cho thuê có thể gọi lại cho bạn.',
      );
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`${apiUrl}/leads`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          listingId: rawId,
          fullName: fullName.trim(),
          phone: cleanPhone,
          email: email.trim() || undefined,
          message: message.trim() || undefined,
          channel: 'web_form',
          consent: true,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const errorDetail =
          Array.isArray(data.message)
            ? data.message.join(', ')
            : data.message || `Lỗi máy chủ (${res.status}). Vui lòng thử lại sau.`;
        throw new Error(errorDetail);
      }

      // Chỉ chuyển sang trạng thái thành công khi máy chủ phản hồi 200/201 thật
      setSubmitted(true);
      setSuccessMessage(
        data.message || 'Đã gửi liên hệ thành công! Người đăng tin sẽ sớm liên lạc lại với bạn.',
      );

      // Đặt timeout đóng modal tự động nhưng cho phép người dùng đóng ngay
      setTimeout(() => {
        setSubmitted(false);
        onClose();
      }, 3500);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleCloseModal() {
    setErrorMessage(null);
    setSubmitted(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-medium text-slate-800">Liên hệ môi giới / Chủ trọ</h2>
            {listingTitle && (
              <p className="text-xs text-slate-500 truncate max-w-sm mt-0.5">{listingTitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleCloseModal}
            className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Nội dung form */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 text-2xl font-bold">
              ✓
            </div>
            <h3 className="text-base font-bold text-slate-900">Đã gửi liên hệ thành công!</h3>
            <p className="text-xs text-slate-600 leading-relaxed px-4">{successMessage}</p>
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCloseModal}
                className="rounded-md bg-emerald-600 px-6 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
            {/* Thông báo lỗi nếu có */}
            {errorMessage && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 leading-relaxed">
                ⚠️ {errorMessage}
              </div>
            )}

            {/* Họ & Tên */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Họ & Tên <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: Nguyễn Văn A"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#58cca9] focus:outline-none focus:ring-1 focus:ring-[#58cca9]"
              />
            </div>

            {/* Số điện thoại */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Số điện thoại di động <span className="text-rose-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="0987 654 321"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#58cca9] focus:outline-none focus:ring-1 focus:ring-[#58cca9]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email (không bắt buộc)
              </label>
              <input
                type="email"
                placeholder="tenban@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-slate-300 px-3.5 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#58cca9] focus:outline-none focus:ring-1 focus:ring-[#58cca9]"
              />
            </div>

            {/* Lời nhắn */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lời nhắn gửi người cho thuê <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full resize-y rounded-md border border-slate-300 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#58cca9] focus:outline-none focus:ring-1 focus:ring-[#58cca9]"
              />
            </div>

            {/* Checkbox Consent (Bắt buộc theo chuẩn bảo mật & pháp lý P0-02) */}
            <div className="flex items-start gap-2 pt-1">
              <input
                type="checkbox"
                id="lead-consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#58cca9] focus:ring-[#58cca9]"
              />
              <label htmlFor="lead-consent" className="text-xs text-slate-600 leading-snug">
                Tôi đồng ý chia sẻ thông tin liên hệ này cho người đăng tin/môi giới để được hỗ trợ xem phòng.
              </label>
            </div>

            {/* Hai nút hành động Gửi và Bỏ qua */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[#58cca9] px-7 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#48bfa9] transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {loading && (
                  <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {loading ? 'Đang gửi...' : 'Gửi liên hệ ngay'}
              </button>

              <button
                type="button"
                onClick={handleCloseModal}
                disabled={loading}
                className="rounded-md border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
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
