import Link from 'next/link';

const FOOTER_LINKS = {
  'Phòng trọ Sinh viên': [
    { href: '/cho-thue-tro', label: 'Phòng trọ khép kín' },
    { href: '/cho-thue-tro?propertyType=ky_tuc_xa', label: 'Ký túc xá / Sleepbox' },
    { href: '/thue?categoryGroup=thue_studio', label: 'Studio & Căn hộ mini' },
    { href: '/thue?utilitiesIncluded=true', label: 'Phòng bao điện nước' },
  ],
  'Cho thuê BĐS': [
    { href: '/thue?propertyType=can_ho', label: 'Cho thuê căn hộ chung cư' },
    { href: '/thue?propertyType=nha_rieng', label: 'Cho thuê nhà nguyên căn' },
    { href: '/cho-thue-mat-bang', label: 'Mặt bằng kinh doanh' },
    { href: '/thue', label: 'Tất cả tin cho thuê' },
  ],
  'Thông tin & Hỗ trợ': [
    { href: '/dang-tin', label: 'Đăng tin cho thuê miễn phí' },
    { href: '/gioi-thieu', label: 'Giới thiệu nền tảng' },
    { href: '/lien-he', label: 'Liên hệ & Hỗ trợ' },
    { href: '/dieu-khoan', label: 'Điều khoản dịch vụ' },
    { href: '/chinh-sach', label: 'Chính sách bảo mật' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-brand-900 text-white">
      {/* Main footer content */}
      <div className="container-max py-12">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/15 text-base font-bold text-white">
                B
              </span>
              <span className="text-lg font-bold tracking-tight">
                BĐS<span className="font-normal opacity-70">.vn</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/60">
              Nền tảng trung gian tìm kiếm <strong>Phòng trọ, Nhà ở & Mặt bằng cho thuê</strong> hàng đầu.
              Minh bạch chi phí điện nước, kết nối trực tiếp chủ trọ và người thuê.
            </p>
            <p className="mt-4 text-sm text-white/60">
              📞 Hotline / Zalo:{' '}
              <a href="tel:0981753082" className="font-bold text-brand-300 hover:text-white transition-colors">
                0981 753 082
              </a>
            </p>
            <p className="mt-1 text-sm text-white/60">
              👤 Phụ trách:{' '}
              <span className="font-semibold text-brand-300">Nguyễn Đức Quân</span>
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([category, links]) => (
            <div key={category}>
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-brand-300">
                {category}
              </h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
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
      <div className="border-t border-white/10">
        <div className="container-max flex flex-col items-center justify-between gap-2 py-5 sm:flex-row">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} BatDongSan.vn — Nền tảng Cho thuê Bất Động Sản hàng đầu.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/60">
            <Link href="/dieu-khoan" className="hover:text-white transition-colors">
              Điều khoản sử dụng
            </Link>
            <span>·</span>
            <Link href="/chinh-sach" className="hover:text-white transition-colors">
              Chính sách bảo mật
            </Link>
            <span>·</span>
            <Link href="/lien-he" className="hover:text-white transition-colors">
              Liên hệ hỗ trợ
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
