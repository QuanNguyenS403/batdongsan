'use client';

import { useState } from 'react';
import { ContactBrokerModal } from '@/components/ContactBrokerModal';
import { RevealPhoneButton } from './RevealPhoneButton';
import { AuthModal } from '@/components/AuthModal';

interface MobileStickyContactBarProps {
  listingId: string;
  listingTitle: string;
  priceFormatted: string;
  depositFormatted?: string;
}

export function MobileStickyContactBar({
  listingId,
  listingTitle,
  priceFormatted,
  depositFormatted,
}: MobileStickyContactBarProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [phone, setPhone] = useState<string | null>(null);

  return (
    <>
      {/* Sticky Bottom Bar chỉ hiển thị trên màn hình nhỏ hơn 768px (Mobile CTA - FE-10) */}
      <div className="fixed bottom-0 inset-x-0 z-40 block md:hidden bg-white/95 backdrop-blur-md border-t border-surface-border px-4 py-2.5 shadow-elevated">
        <div className="flex items-center justify-between gap-3">
          {/* Cụm giá tiền bên trái */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-base font-bold text-brand truncate">{priceFormatted}</span>
              <span className="text-[11px] text-text-muted font-normal">/tháng</span>
            </div>
            {depositFormatted && (
              <p className="text-[10px] text-text-muted truncate">Cọc: {depositFormatted}</p>
            )}
          </div>

          {/* Cụm nút CTA bên phải */}
          <div className="flex items-center gap-2 shrink-0">
            {phone ? (
              <a
                href={`tel:${phone}`}
                aria-label={`Gọi điện cho chủ trọ theo số ${phone}`}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 active:scale-95 transition-all"
              >
                <span>📞</span>
                <span>{phone}</span>
              </a>
            ) : (
              <div className="scale-90 origin-right">
                <RevealPhoneButton
                  listingId={listingId}
                  onPhoneRevealed={setPhone}
                  onRequireAuth={() => setIsAuthModalOpen(true)}
                />
              </div>
            )}

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              aria-label="Mở hộp thoại gửi yêu cầu tư vấn xem phòng"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-600 active:scale-95 transition-all"
            >
              <span>💬</span>
              <span>Tư vấn</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal xác thực nếu cần đăng nhập khi xem số */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => setIsAuthModalOpen(false)}
      />

      {/* Modal gửi liên hệ / đặt lịch xem phòng */}
      <ContactBrokerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        listingId={listingId}
        listingTitle={listingTitle}
      />
    </>
  );
}
