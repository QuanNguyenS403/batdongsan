import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Chính sách bảo mật thông tin — QNS BROKER',
  description:
    'Cam kết bảo vệ dữ liệu cá nhân, số điện thoại và thông tin tài khoản của người dùng trên nền tảng QNS BROKER',
};

export default function ChinhSachPage() {
  return (
    <div className="min-h-screen bg-surface-muted py-10">
      <div className="container-max max-w-4xl">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-text-muted">
          <Link href="/" className="hover:text-brand transition-colors">
            Trang chủ
          </Link>
          <span>›</span>
          <span className="text-text-secondary font-medium">Chính sách bảo mật</span>
        </nav>

        <div className="rounded-2xl border border-surface-border bg-white p-8 md:p-12 shadow-card">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
            Chính sách bảo mật thông tin
          </h1>
          <p className="text-xs text-text-muted mb-8 border-b border-surface-border pb-4">
            Cập nhật lần cuối: Tháng 09/2026
          </p>

          <div className="prose prose-slate max-w-none space-y-6 text-sm text-text-secondary leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">1. Mục đích thu thập thông tin</h2>
              <p>
                QNS BROKER chỉ thu thập các thông tin tối thiểu cần thiết để phục vụ mục đích vận hành và điều phối dịch vụ môi giới:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li><strong>Số điện thoại:</strong> Dùng để gửi mã xác thực OTP, đăng nhập tài khoản và tiếp nhận tư vấn, sắp xếp lịch dẫn xem phòng thực tế</li>
                <li><strong>Họ tên / Tên hiển thị:</strong> Nhận diện người dùng trên hệ thống và ghi nhận trong hồ sơ yêu cầu thuê phòng</li>
                <li><strong>Nhu cầu thuê & Lịch sử tìm kiếm:</strong> Lưu trữ trên tài khoản cá nhân để hỗ trợ chuyên viên tìm kiếm căn phòng phù hợp nhất</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">2. Cơ chế Bảo vệ Thông tin Liên hệ và Quyền riêng tư</h2>
              <p>
                Để bảo vệ quyền riêng tư và tối ưu chất lượng dịch vụ:
              </p>
              <ul className="list-disc pl-5 space-y-1.5 mt-2">
                <li>Số điện thoại hiển thị trên tất cả các tin đăng là số hotline liên hệ chính thức của chuyên viên tư vấn và điều phối QNS BROKER</li>
                <li>Hồ sơ cá nhân và số điện thoại của bên cho thuê được bảo mật nội bộ, chỉ cung cấp cho khách thuê khi tiến hành đối chiếu thẩm quyền pháp lý và ký hợp đồng</li>
                <li>Thông tin khách thuê được bảo vệ nghiêm ngặt, chỉ phục vụ việc tư vấn, xác nhận lịch dẫn xem và kết nối khi giao kết hợp đồng thuê</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">3. Cam kết không chia sẻ dữ liệu cho bên thứ ba</h2>
              <p>
                Chúng tôi cam kết không bán, không chuyển nhượng hoặc thương mại hóa thông tin cá nhân của người dùng cho bất kỳ tổ chức quảng cáo hay bên thứ ba nào, trừ trường hợp có yêu cầu bằng văn bản từ cơ quan pháp luật có thẩm quyền
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">4. Bảo mật mật khẩu và Phiên đăng nhập</h2>
              <p>
                Mọi mật khẩu người dùng đều được băm bằng thuật toán an toàn một chiều (bcrypt) trước khi lưu vào cơ sở dữ liệu. Phiên làm việc được quản lý bằng chuẩn JWT (JSON Web Token) có thời hạn xác thực rõ ràng
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">5. Quyền của người dùng đối với dữ liệu</h2>
              <p>
                Người dùng có toàn quyền truy cập trang <Link href="/tai-khoan/thong-tin" className="text-brand font-semibold hover:underline">Thông tin tài khoản</Link> để cập nhật tên hiển thị, đổi mật khẩu hoặc yêu cầu gỡ bỏ tài khoản và bài đăng bất kỳ lúc nào
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
