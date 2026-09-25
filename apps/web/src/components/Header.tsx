'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authFetch, clearTokens, getAccessToken } from '@/lib/auth-client';

interface CurrentUser {
  id: string;
  fullName: string | null;
  phone: string;
  role?: string;
}


export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 8);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!getAccessToken()) {
      setChecked(true);
      return;
    }
    authFetch('/auth/me')
      .then((res) => {
        if (res.status === 401) {
          clearTokens();
          setUser(null);
          return null;
        }
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data) setUser(data);
      })
      .catch((err) => {
        console.warn('Lỗi kết nối /auth/me tạm thời:', err);
      })
      .finally(() => setChecked(true));
  }, []);

  function handleLogout() {
    clearTokens();
    setUser(null);
    setMenuOpen(false);
    router.push('/');
  }

  const initials = user ? (user.fullName ?? user.phone).charAt(0).toUpperCase() : '';

  return (
    <header
      className={`sticky top-0 z-50 bg-brand text-white transition-shadow duration-200 ${
        scrolled ? 'shadow-elevated' : 'shadow-sm'
      }`}
    >
      <div className="container-max flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-lg font-black text-white ring-1 ring-white/25 shadow-sm">
            Q
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            QNS <span className="font-normal opacity-90">BROKER</span>
          </span>
        </Link>

        {/* Actions bên phải */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {!checked ? (
            <div className="h-9 w-20 skeleton bg-white/20 rounded-xl" />
          ) : user ? (
            <>
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <span>⚙️</span>
                  <span>Quản trị</span>
                </Link>
              )}

              {/* Nút + Đăng tin */}
              <Link
                href="/dang-tin"
                className="inline-flex items-center gap-1 rounded-xl bg-white text-brand px-3.5 py-2 text-xs sm:text-sm font-bold shadow-sm transition-all hover:bg-teal-50 active:scale-[0.98]"
              >
                <span>+ Đăng tin</span>
              </Link>

              {/* Avatar dropdown */}
              <div className="relative">
                <button
                  id="user-menu-button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20 transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand font-bold text-xs shadow-sm">
                    {initials}
                  </span>
                  <span className="hidden md:inline font-semibold truncate max-w-[120px]">
                    {user.fullName?.split(' ').pop() ?? user.phone}
                  </span>
                  <svg className="h-3 w-3 text-white/80" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-surface-border bg-white py-2 shadow-modal animate-slide-down text-slate-800">
                      <div className="px-4 py-2 border-b border-surface-border mb-1">
                        <p className="text-sm font-semibold text-text-primary truncate">{user.fullName ?? user.phone}</p>
                        <p className="text-xs text-text-muted truncate">{user.phone}</p>
                      </div>
                      {user.role === 'admin' && (
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-teal-700 bg-teal-50/60 hover:bg-teal-100/70 transition-colors mb-1"
                        >
                          <span>⚙️</span>
                          <span>Trang Quản trị Hệ thống</span>
                        </Link>
                      )}
                      {[
                        { href: '/tai-khoan/quan-ly-tin', label: 'Quản lý tin đăng', icon: '📋' },
                        { href: '/tai-khoan/tin-da-luu', label: 'BĐS đã lưu', icon: '❤️' },
                        { href: '/tai-khoan/thong-tin', label: 'Thông tin tài khoản', icon: '⚙️' },
                      ].map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-slate-50 hover:text-text-primary transition-colors"
                        >
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </Link>
                      ))}
                      <div className="border-t border-surface-border mt-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                          </svg>
                          <span>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/dang-tin"
                className="inline-flex items-center gap-1 rounded-xl bg-white text-brand px-3.5 py-2 text-xs sm:text-sm font-bold shadow-sm transition-all hover:bg-teal-50 active:scale-[0.98]"
              >
                <span>+ Đăng tin</span>
              </Link>
              <Link
                href="/dang-nhap"
                className="text-xs sm:text-sm font-semibold text-white/95 hover:text-white transition-colors px-2 py-1 whitespace-nowrap"
              >
                Đăng ký/Đăng nhập
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            id="mobile-menu-button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white hover:bg-white/10 md:hidden transition-colors"
            aria-label="Menu"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="border-t border-white/15 bg-brand-700/95 backdrop-blur-md pb-4 animate-slide-down md:hidden text-white">
          <div className="container-max pt-2 space-y-1">
            <Link
              href="/"
              className="flex rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Trang chủ
            </Link>
            <Link
              href="/thue"
              className="flex rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Tìm phòng thuê
            </Link>
            <Link
              href="/lien-he"
              className="flex rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
            >
              Liên hệ chuyên viên
            </Link>
            {user ? (
              <>
                <Link
                  href="/tai-khoan/quan-ly-tin"
                  className="flex rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  Quản lý tin đăng
                </Link>
                <Link
                  href="/tai-khoan/tin-da-luu"
                  className="flex rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-colors"
                >
                  BĐS đã lưu
                </Link>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white font-bold py-2.5 text-sm mt-2"
                  >
                    <span>⚙️</span>
                    <span>Trang Quản trị</span>
                  </Link>
                )}
              </>
            ) : (
              <Link
                href="/dang-nhap"
                className="flex rounded-xl px-4 py-2.5 text-sm font-semibold bg-white/10 hover:bg-white/20 transition-colors mt-2"
              >
                Đăng ký/Đăng nhập
              </Link>
            )}
            <Link
              href="/dang-tin"
              className="flex items-center justify-center gap-1.5 rounded-xl bg-white text-brand font-bold py-2.5 text-sm mt-2 shadow-sm"
            >
              <span>+ Đăng tin cho thuê miễn phí</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
