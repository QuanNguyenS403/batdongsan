import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Điều khoản dịch vụ môi giới cho thuê — QNS Thuê',
  description:
    'Quy định, quyền lợi và nghĩa vụ của người thuê phòng, chủ trọ và bên cho thuê khi tham gia dịch vụ môi giới QNS Thuê',
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
          <span className="text-text-secondary font-medium">Điều khoản dịch vụ</span>
        </nav>

        <div className="rounded-2xl border border-surface-border bg-white p-8 md:p-12 shadow-card">
          <h1 className="text-2xl md:text-3xl font-bold text-text-primary mb-3">
            Điều khoản dịch vụ môi giới cho thuê
          </h1>
          <p className="text-xs text-text-muted mb-8 border-b border-surface-border pb-4">
            Cập nhật lần cuối: Tháng 09/2026
          </p>

          <div className="prose prose-slate max-w-none space-y-6 text-sm text-text-secondary leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">1. Định vị và Vai trò của Nền tảng</h2>
              <p>
                QNS Thuê là dịch vụ môi giới cho thuê bất động sản chuyên biệt (phòng trọ, studio, căn hộ, mặt bằng kinh doanh). Ông Nguyễn Đức Quân là chuyên viên trực tiếp phụ trách tiếp nhận nhu cầu, tư vấn và dẫn khách xem phòng tận nơi
              </p>
              <p className="mt-2 text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs">
                ⚠️ <strong>Phân định trách nhiệm tài chính:</strong> Nền tảng <strong>KHÔNG</strong> thu hộ tiền thuê, không giữ tiền đặt cọc và không bảo lãnh hợp đồng dân sự. Tiền đặt cọc và tiền thuê được bên thuê thanh toán trực tiếp cho bên cho thuê hợp pháp theo hợp đồng thuê
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">2. Quy định đối với Bên cho thuê (Chủ nhà / Bên có quyền cho thuê)</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Ký Thỏa thuận dịch vụ môi giới (HĐ-01) với đơn vị dịch vụ trước khi phòng được công khai tiếp nhận khách thuê</li>
                <li>Cung cấp đầy đủ giấy tờ chứng minh quyền cho thuê hợp pháp và cam kết thông tin thực tế về vị trí, giá thuê, biểu phí dịch vụ</li>
                <li>Thanh toán phí dịch vụ môi giới thành công một lần duy nhất bằng 40% tiền thuê tháng đầu tiên (sau ưu đãi) khi giao dịch hoàn tất ký kết và bàn giao thực tế</li>
                <li>Không tự ý nâng giá, không thay đổi điều kiện đã thỏa thuận và thông báo kịp thời khi phòng không còn khả dụng</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">3. Quyền lợi và Nghĩa vụ của Khách thuê</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Được tra cứu thông tin phòng, tư vấn nhu cầu và được chuyên viên trực tiếp dẫn đi xem phòng thực tế hoàn toàn miễn phí (0 đồng phí môi giới)</li>
                <li>Được đối chiếu thông tin pháp lý, quyền cho thuê của chủ nhà và đọc trước mẫu hợp đồng thuê trước khi đặt cọc hoặc ký kết</li>
                <li>Ký hợp đồng thuê (HĐ-02) trực tiếp với bên cho thuê hợp pháp và nhận bàn giao phòng đúng hiện trạng cam kết</li>
                <li>Không chuyển tiền cọc hoặc thanh toán khi chưa trực tiếp xem phòng và chưa xác minh quyền cho thuê của bên cho thuê</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">4. Điều kiện xác nhận Giao dịch thành công</h2>
              <p>
                Giao dịch được ghi nhận thành công để phát sinh phí môi giới khi đáp ứng đồng thời: hợp đồng thuê được ký kết giữa bên thuê và bên cho thuê, bên thuê đã nhận bàn giao phòng theo biên bản bàn giao, và bên cho thuê đã nhận kỳ thanh toán đầu tiên theo thỏa thuận
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">5. Liên hệ Hỗ trợ và Điều phối</h2>
              <p>
                Mọi yêu cầu tư vấn, hẹn lịch xem phòng hoặc phản ánh chất lượng dịch vụ xin vui lòng liên hệ trực tiếp chuyên viên điều phối qua Hotline:{' '}
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
