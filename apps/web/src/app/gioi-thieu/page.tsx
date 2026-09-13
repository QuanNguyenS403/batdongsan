import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Giới thiệu Nền tảng BĐS Cho Thuê — Minh bạch & Tiện lợi',
  description:
    'Sứ mệnh kết nối trực tiếp chủ trọ và sinh viên, người lao động. Minh bạch chi phí điện nước, tìm phòng gần trường học hàng đầu Việt Nam.',
};

export default function GioiThieuPage() {
  return (
    <div className="min-h-screen bg-surface-muted py-10">
      <div className="container-max max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-text-muted">
          <Link href="/" className="hover:text-brand transition-colors">
            Trang chủ
          </Link>
          <span>›</span>
          <span className="text-text-secondary font-medium">Giới thiệu</span>
        </nav>

        <div className="rounded-2xl border border-surface-border bg-white p-8 md:p-12 shadow-card">
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3.5 py-1 text-xs font-semibold text-brand mb-4">
            🌿 Về chúng tôi
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
            Nền tảng Bất động sản Chuyên biệt Cho thuê
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-8 border-b border-surface-border pb-6">
            QNS&apos;bds.vn ra đời với định hướng chuyên biệt 100% vào phân khúc <strong>cho thuê nhà ở, phòng trọ, studio và mặt bằng</strong>. Chúng tôi giải quyết triệt để nỗi lo &quot;chi phí ẩn&quot; và giúp các bạn sinh viên, người đi làm nhanh chóng tìm được chốn an cư ưng ý.
          </p>

          <div className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl border border-teal-100 bg-teal-50/40">
                <span className="text-2xl">⚡💧</span>
                <h2 className="text-base font-bold text-text-primary mt-2 mb-1">Minh bạch biểu giá dịch vụ</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Bắt buộc niêm yết đơn giá điện theo kWh, nước theo m³ hoặc gói bao điện nước, giúp bạn luôn chủ động ngân sách mà không lo các khoản chi phí phát sinh.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/40">
                <span className="text-2xl">🎓</span>
                <h2 className="text-base font-bold text-text-primary mt-2 mb-1">Tìm phòng gần Trường Đại học</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Lọc phòng theo danh mục các trường ĐH lớn tại TP.HCM và Hà Nội, hiển thị khoảng cách thực tế tính bằng mét và thời gian di chuyển bằng xe máy.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-amber-100 bg-amber-50/40">
                <span className="text-2xl">🤝</span>
                <h2 className="text-base font-bold text-text-primary mt-2 mb-1">Kết nối trực tiếp Chủ trọ</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Xem số điện thoại và kết nối trực tiếp qua Zalo/Cuộc gọi. Nền tảng hoạt động như một cầu nối minh bạch, hoàn toàn không thu phí trung gian từ người thuê.
                </p>
              </div>

              <div className="p-5 rounded-xl border border-emerald-100 bg-emerald-50/40">
                <span className="text-2xl">🛡️</span>
                <h2 className="text-base font-bold text-text-primary mt-2 mb-1">Kiểm duyệt & An toàn</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Tin đăng được duyệt chặt chẽ bởi đội ngũ quản trị. Cơ chế Báo cáo vi phạm (Report) giúp cộng đồng cùng chung tay loại bỏ tin giả, phòng ảo.
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-surface-border bg-slate-50 p-6 text-center">
              <h2 className="text-lg font-bold text-text-primary mb-2">Bạn có phòng trọ hoặc căn hộ cần cho thuê?</h2>
              <p className="text-xs text-text-secondary mb-4 max-w-xl mx-auto">
                Đăng tin miễn phí ngay hôm nay để tiếp cận hàng ngàn sinh viên và người thuê đang tìm kiếm mỗi ngày.
              </p>
              <Link href="/dang-tin" className="btn-primary inline-flex text-xs px-6 py-2.5">
                Đăng tin cho thuê ngay
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
