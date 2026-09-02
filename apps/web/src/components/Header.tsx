'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, clearTokens, getAccessToken } from '@/lib/auth-client';

interface CurrentUser {
  id: string;
  fullName: string | null;
  phone: string;
}

/**
 * TRƯỚC ĐÂY: Header là Server Component tĩnh, luôn hiển thị "Đăng nhập" + "Đăng tin" bất kể
 * người dùng đã đăng nhập hay chưa — sai lệch rõ so với UX của Mogi (đổi sang avatar dropdown
 * khi đã login) mà chính CLAUDE.md/README.md đã mô tả là yêu cầu bắt buộc. Phải chuyển sang
 * Client Component để đọc token trong localStorage và gọi /auth/me xác thực còn hạn hay không.
 */
export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (!getAccessToken()) {
      setChecked(true);
      return;
    }

    // authFetch tự thử /auth/refresh khi accessToken hết hạn (15 phút) trước khi coi là chưa
    // đăng nhập — trước đây gọi fetch() thẳng, khiến bất kỳ ai mở web quá 15 phút đều bị Header
    // âm thầm xoá token và hiện lại nút "Đăng nhập" dù refreshToken (hạn 7 ngày) vẫn còn dùng được.
    authFetch('/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('unauthorized');
        return res.json();
      })
      .then((data) => setUser(data))
      .catch(() => clearTokens())
      .finally(() => setChecked(true));
  }, []);

  function handleLogout() {
    clearTokens();
    setUser(null);
    setMenuOpen(false);
    router.push('/');
  }

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

        {!checked ? (
          <div className="h-9 w-24" />
        ) : user ? (
          <div className="relative flex items-center gap-3">
            <Link
              href="/dang-tin"
              className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-brand-dark"
            >
              + Đăng tin
            </Link>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs">
                {(user.fullName ?? user.phone).charAt(0).toUpperCase()}
              </span>
              {user.fullName ?? user.phone}
            </button>

            {menuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border bg-white py-2 shadow-lg">
                  <Link
                    href="/tai-khoan/quan-ly-tin"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Quản lý tin đăng
                  </Link>
                  <Link
                    href="/tai-khoan/tin-da-luu"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    BĐS đã lưu
                  </Link>
                  <Link
                    href="/tai-khoan/thong-tin"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Thông tin tài khoản
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-50"
                  >
                    Đăng xuất
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
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
        )}
      </div>
    </header>
  );
}
