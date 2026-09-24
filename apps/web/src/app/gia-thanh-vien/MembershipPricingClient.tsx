'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { formatPrice, MembershipPlanItem, PricingSeasonItem } from '@/lib/api';
import { authFetch, getAccessToken } from '@/lib/auth-client';
import { SITE_CONFIG } from '@/lib/constants';

interface Props {
  initialPlans: MembershipPlanItem[];
  activeSeason: PricingSeasonItem | null;
  isFallback?: boolean;
}

export function MembershipPricingClient({ initialPlans, activeSeason, isFallback }: Props) {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<MembershipPlanItem | null>(null);
  const [paymentNote, setPaymentNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const isSurgeActive = Boolean(activeSeason && activeSeason.priceMultiplier > 1);

  function handleSelectPlan(plan: MembershipPlanItem) {
    if (!getAccessToken()) {
      router.push(`/dang-nhap?redirect=/gia-thanh-vien`);
      return;
    }
    setSelectedPlan(plan);
    setPaymentNote('');
    setSuccessMessage(null);
    setErrorMessage(null);
  }

  async function handleSubmitRequest() {
    if (!selectedPlan) return;
    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await authFetch('/memberships/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlan.id,
          paymentNote: paymentNote.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Không thể gửi yêu cầu đăng ký gói.');
      }

      setSuccessMessage(
        data.autoActivated
          ? 'Chúc mừng bạn! Gói Dùng Thử miễn phí đã được kích hoạt thành công.'
          : 'Đã gửi yêu cầu nâng cấp gói thành công! Ban Quản trị sẽ đối soát chuyển khoản và kích hoạt gói cho bạn trong thời gian sớm nhất.',
      );
    } catch (err: any) {
      setErrorMessage(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Tiêu đề & Giới thiệu */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200/80 mb-3">
          ⭐ Dành riêng cho Chủ trọ & Môi giới
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight leading-tight">
          Bảng Giá Gói Hội Viên Đăng Tin Cho Thuê
        </h1>
        <p className="mt-3 text-base text-slate-600 leading-relaxed">
          Tối ưu chi phí, tiếp cận ngay hàng chục ngàn sinh viên và người thuê phòng trọ. Chọn gói phù hợp với quy mô phòng của bạn để luôn có khách thuê nhanh nhất.
        </p>
      </div>

      {/* Banner Surge Pricing Mùa cao điểm */}
      {isSurgeActive && activeSeason && (
        <div className="mb-10 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 p-1 shadow-lg animate-fade-in">
          <div className="rounded-[14px] bg-slate-900/90 backdrop-blur px-6 py-4 sm:flex sm:items-center sm:justify-between text-white">
            <div className="flex items-center gap-3.5 mb-3 sm:mb-0">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/20 border border-orange-400/40 text-2xl">
                🔥
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-base text-white">{activeSeason.name}</h3>
                  <span className="bg-rose-500 text-white text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                    Hệ số x{activeSeason.priceMultiplier}
                  </span>
                </div>
                <p className="text-xs text-orange-200 mt-0.5">
                  {activeSeason.description || 'Giai đoạn nhu cầu tìm phòng trọ của sinh viên tăng vọt 300%. Vị trí hiển thị ưu tiên giúp bạn lấp đầy phòng trống chỉ trong 48h!'}
                </p>
              </div>
            </div>
            <span className="inline-flex shrink-0 items-center text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-xl border border-white/20 transition-colors">
              Đang áp dụng giá mùa cao điểm
            </span>
          </div>
        </div>
      )}

      {/* Banner cảnh báo dev mode khi dùng fallback */}
      {isFallback && (
        <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-300 p-4 text-xs text-amber-800 flex items-center gap-2.5 shadow-sm">
          <span className="text-lg">⚠️</span>
          <div>
            <strong>Chế độ thử nghiệm (DEV):</strong> Đang hiển thị dữ liệu bảng giá mẫu do chưa kết nối cơ sở dữ liệu backend. Bảng giá này không được áp dụng trên môi trường production.
          </div>
        </div>
      )}

      {/* Danh sách thẻ gói hoặc Empty State */}
      {initialPlans.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center max-w-xl mx-auto shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 text-3xl mb-4">
            📦
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Bảng giá đang được cập nhật</h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-6">
            Hiện tại hệ thống đang cập nhật chính sách và bảng giá gói hội viên mới nhất. Quý khách vui lòng quay lại sau hoặc liên hệ bộ phận hỗ trợ để được tư vấn trực tiếp.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="rounded-xl bg-teal-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-700 transition-colors"
            >
              Về trang chủ
            </Link>
            <a
              href={`tel:${SITE_CONFIG.hotline.replace(/\s+/g, '')}`}
              className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Hotline: {SITE_CONFIG.hotline}
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
        {initialPlans.map((plan) => {
          const isFeatured = plan.isFeatured;
          const isTrial = plan.currentPrice === 0;

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-200 ${
                isFeatured
                  ? 'border-2 border-teal-500 bg-white shadow-xl shadow-teal-500/10 ring-1 ring-teal-500'
                  : 'border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300'
              }`}
            >
              {isFeatured && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-gradient-to-r from-teal-600 to-emerald-600 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-sm">
                    Khuyên dùng
                  </span>
                </div>
              )}

              <div>
                {/* Tên gói */}
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  {plan.isSurgeActive && (
                    <span className="rounded bg-rose-50 text-[10px] font-bold text-rose-700 px-1.5 py-0.5 border border-rose-200">
                      Surge
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-500 min-h-[36px] leading-relaxed">
                  {plan.description}
                </p>

                {/* Giá tiền */}
                <div className="mt-5 pb-5 border-b border-slate-100">
                  {plan.isSurgeActive && plan.originalPrice > 0 ? (
                    <div className="mb-1">
                      <span className="text-xs text-slate-400 line-through">
                        {formatPrice(plan.originalPrice)}
                      </span>
                      <span className="ml-1.5 text-[11px] font-semibold text-rose-600">
                        (+{Math.round((plan.priceMultiplier - 1) * 100)}% mùa cao điểm)
                      </span>
                    </div>
                  ) : null}

                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-extrabold tracking-tight ${isFeatured ? 'text-teal-600' : 'text-slate-900'}`}>
                      {isTrial ? 'Miễn phí' : formatPrice(plan.currentPrice)}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">/ 30 ngày</span>
                  </div>
                </div>

                {/* Danh sách đặc quyền */}
                <ul className="mt-6 space-y-3.5 text-xs text-slate-600">
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 font-bold text-xs">
                      ✓
                    </span>
                    <span>
                      Tối đa <strong>{plan.maxActiveListings} tin</strong> hiển thị đồng thời
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 font-bold text-xs">
                      ✓
                    </span>
                    <span>
                      Thời hạn hiển thị <strong>{plan.durationDays} ngày</strong> liên tục
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 font-bold text-xs">
                      ✓
                    </span>
                    <span>
                      Phạm vi đăng tin: <strong>{plan.regionScope || 'Toàn quốc'}</strong>
                    </span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-50 text-teal-600 font-bold text-xs">
                      ✓
                    </span>
                    <span>Hỗ trợ tiếp cận sinh viên quanh các trường ĐH lớn</span>
                  </li>
                  {plan.maxActiveListings >= 30 && (
                    <li className="flex items-center gap-2.5 font-medium text-teal-700">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-xs">
                        ★
                      </span>
                      <span>Ưu tiên xuất hiện đầu trang danh mục tìm phòng</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Nút hành động */}
              <div className="mt-8 pt-4">
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan)}
                  className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all duration-150 shadow-sm ${
                    isFeatured
                      ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 hover:shadow-md'
                      : isTrial
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {isTrial ? 'Bắt đầu dùng thử' : 'Đăng ký gói này'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Cam kết minh bạch */}
      <div className="mt-16 rounded-3xl bg-slate-50 border border-slate-200/80 p-8 sm:p-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center sm:text-left">
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-2xl mb-2">⚡</span>
            <h4 className="font-bold text-sm text-slate-900">Kích hoạt nhanh chóng</h4>
            <p className="mt-1 text-xs text-slate-600">
              Admin đối soát chuyển khoản và kích hoạt gói cho bạn trong vòng 15-30 phút sau khi gửi yêu cầu.
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-2xl mb-2">🛡️</span>
            <h4 className="font-bold text-sm text-slate-900">Không tự động gia hạn ngầm</h4>
            <p className="mt-1 text-xs text-slate-600">
              Hệ thống không trừ tiền tự động. Khi hết 30 ngày, bạn chủ động quyết định có tiếp tục gia hạn hay không.
            </p>
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <span className="text-2xl mb-2">📞</span>
            <h4 className="font-bold text-sm text-slate-900">Hỗ trợ chủ trọ tận tình</h4>
            <p className="mt-1 text-xs text-slate-600">
              Cần hỗ trợ chụp ảnh, xác thực tin hoặc tư vấn định giá cho thuê? Hotline/Tổng đài: <strong>{SITE_CONFIG.hotline}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Modal đăng ký gói */}
      {selectedPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="bg-teal-600 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Đăng ký {selectedPlan.name}</h3>
                <p className="text-xs text-teal-100 mt-0.5">
                  Thời hạn: 30 ngày • Tối đa {selectedPlan.maxActiveListings} tin hiển thị
                </p>
              </div>
              <button
                onClick={() => setSelectedPlan(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {successMessage ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl mb-3">
                    ✓
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mb-2">Yêu cầu đã được ghi nhận</h4>
                  <p className="text-xs text-slate-600 leading-relaxed mb-6">
                    {successMessage}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => {
                        setSelectedPlan(null);
                        setSuccessMessage(null);
                        router.push('/tai-khoan/quan-ly-tin');
                      }}
                      className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors"
                    >
                      Đến Quản lý tin đăng
                    </button>
                    <button
                      onClick={() => {
                        setSelectedPlan(null);
                        setSuccessMessage(null);
                      }}
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {errorMessage && (
                    <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                      ⚠️ {errorMessage}
                    </div>
                  )}

                  {selectedPlan.currentPrice > 0 ? (
                    <div>
                      {/* Hướng dẫn chuyển khoản ngân hàng */}
                      <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 mb-4">
                        <p className="text-xs font-bold text-slate-700 mb-2.5">
                          🏦 Thông tin chuyển khoản thanh toán:
                        </p>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Ngân hàng:</span>
                            <strong className="text-slate-900">{SITE_CONFIG.bankAccount.bankName}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Số tài khoản:</span>
                            <strong className="text-teal-700 font-mono text-sm">{SITE_CONFIG.bankAccount.accountNumber}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Chủ tài khoản:</span>
                            <strong className="text-slate-900">{SITE_CONFIG.bankAccount.accountName}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Số tiền cần chuyển:</span>
                            <strong className="text-rose-600 font-bold text-sm">
                              {formatPrice(selectedPlan.currentPrice)}
                            </strong>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                            <span className="text-slate-500">Nội dung CK:</span>
                            <code className="bg-teal-50 text-teal-800 font-mono px-2 py-0.5 rounded text-[11px] font-bold">
                              BDS GOI {selectedPlan.code.toUpperCase()} [SĐT của bạn]
                            </code>
                          </div>
                        </div>
                      </div>

                      {/* Ô nhập ghi chú */}
                      <div className="mb-5">
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Ghi chú chuyển khoản / Mã giao dịch (Không bắt buộc):
                        </label>
                        <input
                          type="text"
                          value={paymentNote}
                          onChange={(e) => setPaymentNote(e.target.value)}
                          placeholder="Ví dụ: Đã chuyển 499k từ MBBank lúc 10h15..."
                          className="w-full text-xs rounded-xl border border-slate-300 px-3.5 py-2.5 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                        />
                        <p className="mt-1 text-[11px] text-slate-500">
                          Nhập mã giao dịch để Ban quản trị đối soát và kích hoạt gói nhanh nhất.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-5 text-xs text-slate-600 leading-relaxed bg-teal-50/70 border border-teal-200/80 rounded-2xl p-4">
                      🎁 Bạn đang chọn <strong>Gói Dùng Thử miễn phí</strong>. Sau khi bấm xác nhận, gói sẽ được kích hoạt ngay lập tức cho tài khoản của bạn.
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleSubmitRequest}
                      className="flex-1 py-3 px-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-r-transparent" />
                          <span>Đang gửi yêu cầu...</span>
                        </>
                      ) : (
                        <span>{selectedPlan.currentPrice === 0 ? 'Kích hoạt ngay' : 'Tôi đã chuyển khoản, gửi yêu cầu'}</span>
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => setSelectedPlan(null)}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      Hủy
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
