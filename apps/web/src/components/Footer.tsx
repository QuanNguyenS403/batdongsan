import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/constants';

const FOOTER_LINKS = {
  'Căn hộ & Studio': [
    { href: '/thue?categoryGroup=thue_can_ho', label: 'Cho thuê Căn hộ' },
    { href: '/thue?categoryGroup=thue_can_ho&propertyType=can_ho_mini', label: 'Căn hộ mini' },
    { href: '/thue?categoryGroup=thue_can_ho&propertyType=can_ho_dich_vu', label: 'Căn hộ dịch vụ' },
    { href: '/thue?categoryGroup=thue_studio', label: 'Cho thuê Studio' },
  ],
  'Phòng trọ & Mặt bằng': [
    { href: '/cho-thue-tro', label: 'Phòng trọ sinh viên' },
    { href: '/cho-thue-tro?propertyType=ky_tuc_xa', label: 'Ký túc xá / Sleepbox' },
    { href: '/thue?propertyType=nha_rieng', label: 'Cho thuê nhà nguyên căn' },
    { href: '/cho-thue-mat-bang', label: 'Mặt bằng kinh doanh' },
  ],
  'Thông tin & Hỗ trợ': [
    { href: '/gia-thanh-vien', label: 'Bảng giá gói hội viên' },
    { href: '/dang-tin', label: 'Đăng tin cho thuê miễn phí' },
    { href: '/gioi-thieu', label: 'Giới thiệu nền tảng' },
    { href: '/lien-he', label: 'Liên hệ & Hỗ trợ' },
    { href: '/dieu-khoan', label: 'Điều khoản dịch vụ' },
    { href: '/chinh-sach', label: 'Chính sách bảo mật' },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-slate-700 bg-slate-900 text-white">
      <div className="container-max py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-base font-bold text-white">
                Q
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                QNS <span className="font-normal text-slate-300">Thuê</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Nền tảng cho thuê chuyên biệt — <strong className="text-white">Rõ chi phí, đúng người cho thuê</strong>
              <br />
              Minh bạch biểu phí trọn gói, kết nối trực tiếp bên có quyền cho thuê
            </p>
            <div className="mt-4 space-y-2">
              <p className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-brand">📞</span>
                <span>Hotline:</span>
                <a href={`tel:${SITE_CONFIG.hotline.replace(/\s+/g, '')}`} className="font-bold text-white hover:text-brand transition-colors">
                  {SITE_CONFIG.hotline}
                </a>
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-300">
                <span className="text-brand">✉️</span>
                <span>Email:</span>
                <a href={`mailto:${SITE_CONFIG.supportEmail}`} className="font-semibold text-white hover:text-brand transition-colors">
                  {SITE_CONFIG.supportEmail}
                </a>
              </p>
              <p className="flex items-start gap-2 text-sm text-slate-400">
                <span className="text-brand shrink-0">📍</span>
                <span>{SITE_CONFIG.address}</span>
              </p>
              <p className="flex items-center gap-2 text-sm text-slate-400">
                <span className="text-brand">🕐</span>
                <span>{SITE_CONFIG.workingHours}</span>
              </p>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-slate-700/60">
        <div className="container-max flex flex-col items-center justify-between gap-2 py-5 sm:flex-row">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} QNS&apos;bds.vn — Nền tảng Cho thuê Bất Động Sản hàng đầu
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <Link href="/dieu-khoan" className="hover:text-white transition-colors">
              Điều khoản sử dụng
            </Link>
            <span className="text-slate-600">·</span>
            <Link href="/chinh-sach" className="hover:text-white transition-colors">
              Chính sách bảo mật
            </Link>
            <span className="text-slate-600">·</span>
            <Link href="/lien-he" className="hover:text-white transition-colors">
              Liên hệ hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
