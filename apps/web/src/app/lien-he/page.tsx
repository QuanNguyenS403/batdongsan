import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Liên hệ & Hỗ trợ | QNS BROKER',
  description:
    'Thông tin liên hệ, hotline hỗ trợ, báo cáo tin đăng vi phạm và giải đáp thắc mắc người dùng tại QNS BROKER',
};

export default function ContactPage() {
  return (
    <div className="bg-surface-subtle min-h-[80vh] py-8 lg:py-12">
      <div className="container-max max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-text-muted mb-6">
          <Link href="/" className="hover:text-brand transition-colors">
            Trang chủ
          </Link>
          <span>/</span>
          <span className="text-text-secondary font-medium">Liên hệ</span>
        </nav>

        <div className="rounded-2xl border border-surface-border bg-white p-8 md:p-12 shadow-card">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
            Thông tin Liên hệ & Hỗ trợ
          </h1>
          <p className="text-sm text-text-secondary leading-relaxed mb-8 border-b border-surface-border pb-4">
            Ban Quản trị nền tảng QNS BROKER luôn sẵn sàng lắng nghe ý kiến đóng góp, giải đáp thắc mắc và hỗ trợ bạn trong quá trình tìm phòng hoặc đăng tin
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="rounded-xl border border-surface-border bg-slate-50/70 p-5 space-y-4">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span>📞</span> Kênh liên hệ trực tiếp
              </h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-text-muted">Hotline hỗ trợ (24/7):</p>
                  <a href={`tel:${SITE_CONFIG.hotline.replace(/\s+/g, '')}`} className="text-base font-bold text-brand hover:underline">
                    {SITE_CONFIG.hotline}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Địa chỉ văn phòng:</p>
                  <p className="font-semibold text-text-primary">{SITE_CONFIG.address}</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Thời gian làm việc:</p>
                  <p className="text-text-secondary">{SITE_CONFIG.workingHours} (Tất cả các ngày trong tuần)</p>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Email tiếp nhận thông tin:</p>
                  <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="text-brand hover:underline">
                    {SITE_CONFIG.supportEmail}
                  </a>
                </div>
                <div>
                  <p className="text-xs text-text-muted">Phụ trách kỹ thuật & Vận hành:</p>
                  <p className="font-semibold text-text-primary">Đội ngũ Vận hành QNS BROKER</p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-slate-50/70 p-5 space-y-4">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <span>💡</span> Hướng dẫn xử lý nhanh
              </h2>
              <div className="space-y-2.5 text-xs text-text-secondary leading-relaxed">
                <p>
                  • <strong>Tin đăng chưa được duyệt:</strong> Ban Quản trị duyệt tin theo thứ tự gửi trong vòng 1-2 giờ. Bạn có thể kiểm tra trạng thái tại <Link href="/tai-khoan/quan-ly-tin" className="text-brand font-semibold underline">Quản lý tin</Link>
                </p>
                <p>
                  • <strong>Báo cáo tin vi phạm / Lừa đảo:</strong> Vui lòng nhấn nút <strong>"Báo vi phạm"</strong> ngay tại trang chi tiết tin hoặc gửi tin nhắn Zalo kèm mã tin đăng để chúng tôi xác minh và gỡ bỏ ngay lập tức
                </p>
                <p>
                  • <strong>Quên mật khẩu:</strong> Sử dụng chức năng <Link href="/dang-nhap" className="text-brand font-semibold underline">Quên mật khẩu qua OTP</Link> trên form đăng nhập để đặt lại mật khẩu trong 30 giây
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
