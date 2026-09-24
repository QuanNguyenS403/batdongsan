import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Điều khoản sử dụng dịch vụ — QNS Thuê',
  description:
    'Quy định, quyền lợi và nghĩa vụ của người thuê phòng, chủ trọ và bên cho thuê khi tham gia nền tảng QNS Thuê',
};

export default function DieuKhoanPage() {
  return (
    <div className="min-h-screen bg-surface-muted py-10">
      <div className="container-max max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-text-muted">
          <Link href="/" className="hover:text-brand transition-colors">
            Trang chủ
          </Link>
          <span>›</span>
          <span className="text-text-secondary font-medium">Điều khoản sử dụng</span>
        </nav>

        <div className="rounded-2xl border border-surface-border bg-white p-8 md:p-12 shadow-card">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
            Điều khoản sử dụng dịch vụ
          </h1>
          <p className="text-xs text-text-muted mb-8 border-b border-surface-border pb-4">
            Cập nhật lần cuối: Tháng 09/2026
          </p>

          <div className="prose prose-slate max-w-none space-y-6 text-sm text-text-secondary leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">1. Định vị và Vai trò của Nền tảng</h2>
              <p>
                QNS&apos;bds.vn là nền tảng công nghệ trung gian kết nối Người có nhu cầu thuê phòng trọ, căn hộ, nhà ở với Chủ nhà trọ và Người môi giới được ủy quyền
              </p>
              <p className="mt-2 text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
                ⚠️ <strong>Lưu ý quan trọng:</strong> Nền tảng <strong>KHÔNG</strong> trực tiếp thực hiện hay bảo lãnh bất kỳ giao dịch đặt cọc, thanh toán tiền thuê hoặc ký kết hợp đồng dân sự nào. Mọi thỏa thuận tài chính diễn ra trực tiếp giữa người thuê và chủ phòng
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">2. Quy định đối với Người đăng tin (Chủ trọ / Môi giới)</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Cam kết cung cấp thông tin trung thực về vị trí, diện tích, giá thuê và tình trạng phòng trống thực tế</li>
                <li><strong>Minh bạch chi phí dịch vụ:</strong> Bắt buộc công khai đơn giá điện (đ/kWh), nước (đ/m³ hoặc đ/người), tiền cọc và thời hạn hợp đồng tối thiểu</li>
                <li>Không sử dụng hình ảnh mang tính minh họa sai lệch, không chèn watermark số điện thoại đè lên ảnh</li>
                <li>Gỡ hoặc cập nhật trạng thái tin đăng ngay khi phòng đã được cho thuê thành công</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">3. Quyền lợi và Lưu ý đối với Người đi thuê (Sinh viên / Khách thuê)</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Được tra cứu thông tin phòng, tiện ích và các biểu phí liên quan hoàn toàn miễn phí</li>
                <li>Được xem số điện thoại và liên hệ trực tiếp chủ trọ sau khi xác thực tài khoản</li>
                <li>Có quyền báo cáo vi phạm (report) khi phát hiện phòng ảo, chênh lệch giá, hoặc có dấu hiệu gian dối</li>
                <li><strong>Khuyến cáo:</strong> Tuyệt đối không chuyển tiền cọc giữ phòng qua mạng khi chưa trực tiếp đến xem phòng và xác minh hợp đồng, giấy tờ chủ sở hữu</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">4. Kiểm duyệt và Xử lý vi phạm</h2>
              <p>
                Ban Quản trị có quyền từ chối phê duyệt, tạm khóa hoặc xóa vĩnh viễn các tin đăng vi phạm quy chuẩn cộng đồng, có phản ánh tiêu cực từ người thuê hoặc có dấu hiệu lừa đảo mà không cần thông báo trước
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">5. Liên hệ Hỗ trợ</h2>
              <p>
                Mọi thắc mắc hoặc khiếu nại xin vui lòng liên hệ qua Hotline:{' '}
                <a href={`tel:${SITE_CONFIG.hotline.replace(/\s+/g, '')}`} className="font-bold text-brand hover:underline">
                  {SITE_CONFIG.hotline}
                </a>{' '}
                hoặc truy cập trang <Link href="/lien-he" className="text-brand font-semibold hover:underline">Liên hệ</Link>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
