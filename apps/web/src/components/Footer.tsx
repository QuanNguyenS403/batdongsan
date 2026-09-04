import Link from 'next/link';

const FOOTER_LINKS = {
  'Bán BĐS': [
    { href: '/mua-ban?propertyType=nha_rieng', label: 'Nhà riêng / Nhà phố' },
    { href: '/mua-ban?propertyType=dat_nen', label: 'Đất nền / Thổ cư' },
    { href: '/mua-ban?propertyType=can_ho', label: 'Căn hộ chung cư' },
    { href: '/mua-ban', label: 'Tất cả BĐS bán' },
  ],
  'Cho thuê BĐS': [
    { href: '/thue?propertyType=can_ho', label: 'Cho thuê căn hộ' },
    { href: '/thue?propertyType=nha_rieng', label: 'Cho thuê nhà riêng' },
    { href: '/thue', label: 'Tất cả BĐS cho thuê' },
  ],
  'Phòng trọ & Mặt bằng': [
    { href: '/thue?propertyType=phong_tro', label: 'Cho thuê phòng trọ' },
    { href: '/thue?propertyType=mat_bang', label: 'Cho thuê mặt bằng kinh doanh' },
    { href: '/dang-nhap', label: 'Đăng nhập tài khoản' },
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
              Bất động sản <strong>Nguyễn Đức Quân</strong> — Cung cấp dịch vụ Bán BĐS, Cho thuê BĐS,
              Cho thuê phòng trọ và Cho thuê mặt bằng kinh doanh uy tín, chính chủ.
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
            © {new Date().getFullYear()} BatDongSan.vn — Đang trong giai đoạn phát triển. Tin đăng là dữ liệu mẫu.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <span>Điều khoản sử dụng</span>
            <span>·</span>
            <span>Chính sách bảo mật</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
