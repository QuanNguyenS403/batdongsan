'use client';

import { useState } from 'react';
import { RevealPhoneButton } from './RevealPhoneButton';
import { SaveListingButton } from './SaveListingButton';
import { PropertyShareButtons } from './PropertyShareButtons';
import { AuthModal } from '@/components/AuthModal';
import { ContactBrokerModal } from '@/components/ContactBrokerModal';

interface OwnerContactBoxProps {
  listingId: string;
  ownerName: string;
  joinedText: string;
  listingTitle: string;
}

export function OwnerContactBox({
  listingId,
  ownerName,
  joinedText,
  listingTitle,
}: OwnerContactBoxProps) {
  const [phone, setPhone] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [autoRevealTrigger, setAutoRevealTrigger] = useState(0);

  // Loại bỏ số điện thoại đính kèm trong ngoặc bên cạnh tên nếu có
  const cleanOwnerName = (ownerName || 'Chủ phòng trọ').replace(/\s*\(\d+\)\s*/g, '').trim();
  const initialLetter = cleanOwnerName.charAt(0).toUpperCase();

  function handleAuthSuccess() {
    // Tự động kích hoạt hiển thị số điện thoại ngay sau khi đăng nhập thành công
    setAutoRevealTrigger((prev) => prev + 1);
  }

  return (
    <>
      <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-4">
        {/* Thông tin cá nhân chủ phòng */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
            {initialLetter}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-text-primary truncate">{cleanOwnerName}</p>
              <span
                title="Tài khoản đã xác thực"
                className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#1877F2] text-[10px] text-white font-bold"
              >
                ✓
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">Đã tham gia: {joinedText}</p>
          </div>
        </div>

        {/* Nút bấm xem số điện thoại - Chưa đăng nhập sẽ mở AuthModal (Ảnh 1) */}
        <RevealPhoneButton
          listingId={listingId}
          onPhoneRevealed={(p) => setPhone(p)}
          onRequireAuth={() => setIsAuthModalOpen(true)}
          autoRevealTrigger={autoRevealTrigger}
        />

        {/* Nút gửi tin nhắn - Mở modal Liên hệ môi giới (Ảnh 2) */}
        <div>
          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-surface-border bg-white py-2.5 px-4 font-semibold text-text-secondary hover:border-brand hover:text-brand transition-colors"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
            <span>Gửi tin nhắn</span>
          </button>
        </div>

        {/* Hàng hành động: Lưu tin + Chia sẻ */}
        <div className="flex items-center justify-between border-t border-surface-border pt-3">
          <SaveListingButton listingId={listingId} />
          <PropertyShareButtons title={listingTitle} />
        </div>
      </div>

      {/* Modal đăng ký / đăng nhập chuẩn Ảnh 1 */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Modal liên hệ môi giới chuẩn Ảnh 2 */}
      <ContactBrokerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        listingId={listingId}
        listingTitle={listingTitle}
      />
    </>
  );
}
