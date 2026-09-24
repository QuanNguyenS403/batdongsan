import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Giới thiệu Dịch vụ BĐS Cho Thuê — Minh bạch & Tiện lợi',
  description:
    'Dịch vụ môi giới cho thuê chuyên nghiệp — minh bạch chi phí điện nước, chuyên viên trực tiếp tư vấn và dẫn xem phòng thực tế miễn phí cho người thuê',
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
            Dịch vụ Bất động sản Chuyên biệt Cho thuê
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-8 border-b border-surface-border pb-6">
            QNS Thuê ra đời với định hướng chuyên biệt 100% vào phân khúc <strong>cho thuê nhà ở, phòng trọ, studio và mặt bằng kinh doanh</strong>. Chúng tôi giải quyết triệt để nỗi lo &quot;chi phí ẩn&quot; và hỗ trợ người thuê tìm được căn phòng ưng ý với chuyên viên dẫn xem trực tiếp
          </p>

          <div className="space-y-8">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl border border-teal-100 bg-teal-50/40">
                <span className="text-2xl">⚡💧</span>
                <h2 className="text-base font-bold text-text-primary mt-2 mb-1">Minh bạch biểu giá dịch vụ</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Bắt buộc niêm yết đơn giá điện theo kWh, nước theo m³ hoặc gói bao điện nước, giúp bạn luôn chủ động ngân sách mà không lo các khoản chi phí phát sinh
                </p>
              </div>

              <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/40">
                <span className="text-2xl">🎓</span>
                <h2 className="text-base font-bold text-text-primary mt-2 mb-1">Tìm phòng gần Trường Đại học</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Lọc phòng theo danh mục các trường ĐH lớn tại TP.HCM và Hà Nội, hiển thị khoảng cách thực tế tính bằng mét và thời gian di chuyển bằng xe máy
                </p>
              </div>

              <div className="p-5 rounded-xl border border-amber-100 bg-amber-50/40">
                <span className="text-2xl">🤝</span>
                <h2 className="text-base font-bold text-text-primary mt-2 mb-1">Tư vấn & Dẫn xem tận nơi</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Chuyên viên trực tiếp tiếp nhận nhu cầu, tư vấn chi tiết và sắp xếp lịch dẫn xem phòng thực tế hoàn toàn miễn phí cho người thuê
                </p>
              </div>

              <div className="p-5 rounded-xl border border-emerald-100 bg-emerald-50/40">
                <span className="text-2xl">🛡️</span>
                <h2 className="text-base font-bold text-text-primary mt-2 mb-1">Kiểm duyệt & An toàn</h2>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Tin đăng được duyệt chặt chẽ kèm xác thực thẩm quyền cho thuê. Hỗ trợ khách thuê kiểm tra giấy tờ pháp lý trước khi ký hợp đồng và bàn giao
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-surface-border bg-slate-50 p-6 text-center">
              <h2 className="text-lg font-bold text-text-primary mb-2">Bạn có phòng trọ hoặc căn hộ cần cho thuê?</h2>
              <p className="text-xs text-text-secondary mb-4 max-w-xl mx-auto">
                Gửi thông tin phòng để hợp tác dịch vụ môi giới chuyên nghiệp, tiếp cận khách thuê phù hợp và chỉ thanh toán phí khi cho thuê thành công
              </p>
              <Link href="/dang-tin" className="btn-primary inline-flex text-xs px-6 py-2.5">
                Gửi thông tin phòng cho thuê
              </Link>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
