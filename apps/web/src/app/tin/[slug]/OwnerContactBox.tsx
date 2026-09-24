'use client';

import { useState } from 'react';
import { RevealPhoneButton } from './RevealPhoneButton';
import { SaveListingButton } from './SaveListingButton';
import { PropertyShareButtons } from './PropertyShareButtons';
import { AuthModal } from '@/components/AuthModal';
import { ContactBrokerModal } from '@/components/ContactBrokerModal';
import { SITE_CONFIG } from '@/lib/constants';

interface OwnerContactBoxProps {
  listingId: string;
  ownerName: string;
  joinedText: string;
  listingTitle: string;
  isPhoneVerified?: boolean;
  isIdVerified?: boolean;
  contactAgent?: {
    displayName?: string;
    workPhone?: string;
    title?: string;
    avatarUrl?: string;
  };
}

export function OwnerContactBox({
  listingId,
  ownerName,
  joinedText,
  listingTitle,
  isPhoneVerified = false,
  isIdVerified = false,
  contactAgent,
}: OwnerContactBoxProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [autoRevealTrigger, setAutoRevealTrigger] = useState(0);

  // Thông tin người tư vấn & dẫn xem trực tiếp (BR-01, BR-02)
  const agentName = contactAgent?.displayName || SITE_CONFIG.agentName;
  const agentRole = contactAgent?.title || SITE_CONFIG.agentRole;
  const agentPhone = contactAgent?.workPhone || SITE_CONFIG.hotline;
  const zaloUrl = `https://zalo.me/${agentPhone.replace(/\s+/g, '')}`;

  // Tên bên cho thuê đã làm sạch (BR-03, BR-06)
  const cleanOwnerName = (ownerName || 'Bên cho thuê').replace(/\s*\(\d+\)\s*/g, '').trim();

  function handleAuthSuccess() {
    setAutoRevealTrigger((prev) => prev + 1);
  }

  return (
    <>
      <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-4">
        {/* Khối người tư vấn và trực tiếp dẫn xem (BR-01, BR-02) */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand ring-2 ring-brand/20">
            {agentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-bold text-text-primary truncate">{agentName}</p>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                Tư vấn & dẫn xem miễn phí
              </span>
            </div>
            <p className="text-xs font-medium text-brand mt-0.5">{agentRole}</p>
            <p className="text-[11px] text-text-muted">Đại diện dịch vụ của {SITE_CONFIG.name}</p>
          </div>
        </div>

        {/* Nút gọi trực tiếp & Nhắn Zalo */}
        <div className="space-y-2">
          {/* Nút bấm xem số hotline người dẫn xem */}
          <RevealPhoneButton
            listingId={listingId}
            onRequireAuth={() => setIsAuthModalOpen(true)}
            autoRevealTrigger={autoRevealTrigger}
          />

          <div className="grid grid-cols-2 gap-2">
            <a
              href={`tel:${agentPhone.replace(/\s+/g, '')}`}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-600 bg-emerald-50 py-2.5 px-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors active:scale-[0.99]"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              <span>Gọi tư vấn</span>
            </a>

            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-600 bg-blue-50 py-2.5 px-3 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors active:scale-[0.99]"
            >
              <span className="font-black text-xs">Zalo</span>
              <span>Nhắn Zalo</span>
            </a>
          </div>

          {/* Nút Đề xuất lịch xem phòng */}
          <button
            type="button"
            onClick={() => setIsContactModalOpen(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand py-2.5 px-4 font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors active:scale-[0.99]"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
            <span>Đề xuất lịch xem phòng</span>
          </button>
        </div>

        {/* Khối minh bạch bên cho thuê (Lessor Disclosure - BR-06) */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-text-muted">Bên cho thuê:</span>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-text-primary">{cleanOwnerName}</span>
              {isIdVerified && (
                <span
                  title="Danh tính / CCCD đã xác thực"
                  className="inline-flex items-center rounded-full bg-emerald-100 px-1 py-0.2 text-[9px] font-semibold text-emerald-700"
                >
                  CCCD
                </span>
              )}
              {isPhoneVerified && (
                <span
                  title="Số điện thoại đã xác thực OTP"
                  className="inline-flex items-center rounded-full bg-blue-100 px-1 py-0.2 text-[9px] font-semibold text-blue-700"
                >
                  ✓
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-text-muted">
            <span>Thời gian tham gia:</span>
            <span>{joinedText}</span>
          </div>
          <p className="text-[11px] text-text-secondary pt-1 border-t border-slate-200/60 leading-relaxed">
            Hợp đồng thuê ký trực tiếp với bên có quyền cho thuê. Chủ thanh toán phí dịch vụ khi thuê thành công theo thỏa thuận
          </p>
        </div>

        {/* Hàng hành động: Lưu tin + Chia sẻ */}
        <div className="flex items-center justify-between border-t border-surface-border pt-3">
          <SaveListingButton listingId={listingId} />
          <PropertyShareButtons title={listingTitle} />
        </div>
      </div>

      {/* Modal đăng ký / đăng nhập */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Modal đề xuất lịch xem phòng với người tư vấn */}
      <ContactBrokerModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        listingId={listingId}
        listingTitle={listingTitle}
      />
    </>
  );
}
