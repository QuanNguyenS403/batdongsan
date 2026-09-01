import Link from 'next/link';

export function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-xl font-bold text-brand-dark">
          🏠 BatDongSan<span className="text-gray-900">.demo</span>
        </Link>

        <nav className="hidden gap-6 text-sm font-medium text-gray-700 md:flex">
          <Link href="/mua-ban" className="hover:text-brand-dark">Tìm mua</Link>
          <Link href="/thue" className="hover:text-brand-dark">Tìm thuê</Link>
          <Link href="/du-an" className="hover:text-brand-dark">Dự án</Link>
          <Link href="/moi-gioi" className="hover:text-brand-dark">Môi giới</Link>
          <Link href="/gia-nha-dat" className="hover:text-brand-dark">Giá nhà đất</Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link href="/dang-nhap" className="text-sm font-medium text-gray-700 hover:text-brand-dark">
            Đăng nhập
          </Link>
          <Link
            href="/dang-tin"
            className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-brand-dark"
          >
            + Đăng tin
          </Link>
        </div>
      </div>
    </header>
  );
}
