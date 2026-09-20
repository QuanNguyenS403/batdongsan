'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { authFetch, clearTokens, getAccessToken } from '@/lib/auth-client';
import { SITE_CONFIG } from '@/lib/constants';

interface CurrentUser {
  id: string;
  fullName: string | null;
  phone: string;
  role?: string;
}

const NAV_LINKS = [
  { href: '/', label: 'Trang chủ' },
  { href: '/thue?categoryGroup=thue_can_ho', label: 'Căn hộ' },
  { href: '/thue?categoryGroup=thue_studio', label: 'Studio' },
  { href: '/cho-thue-tro', label: 'Phòng trọ SV' },
  { href: '/cho-thue-mat-bang', label: 'Mặt bằng kinh doanh' },
  { href: '/gia-thanh-vien', label: 'Bảng giá gói' },
];

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [checked, setChecked] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  function isLinkActive(href: string) {
    if (typeof window === 'undefined') return false;
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      return pathname === path && window.location.search.includes(query);
    }
    return pathname === href;
  }

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

  const initials = user ? (user.fullName ?? user.phone).charAt(0).toUpperCase() : '';

  return (
    <header
      className={`sticky top-0 z-50 transition-shadow duration-200 ${
        scrolled ? 'shadow-elevated' : 'shadow-sm'
      }`}
    >
      {/* Tầng trên: teal — brand identity */}
      <div className="bg-brand">
        <div className="container-max flex h-14 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-base font-black text-white ring-1 ring-white/20">
              Q
            </span>
            <span className="text-base font-bold tracking-tight text-white">
              QNS <span className="font-normal opacity-90">Thuê</span>
            </span>
          </Link>

          <div className="flex items-center gap-5 text-sm text-white/90">
            <a
              href={`tel:${SITE_CONFIG.hotline.replace(/\s+/g, '')}`}
              className="hidden sm:inline-flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <span>📞</span>
              <span>Hotline: <strong className="text-white">{SITE_CONFIG.hotline}</strong></span>
            </a>
            {!checked ? (
              <div className="h-5 w-20 skeleton rounded" />
            ) : user ? (
              <span className="font-medium text-white">Xin chào, {user.fullName?.split(' ').pop() ?? user.phone}</span>
            ) : (
              <Link href="/dang-nhap" className="font-medium text-white hover:text-brand-200 transition-colors">
                Đăng nhập
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tầng dưới: trắng — navigation */}
      <div className="bg-white border-b border-surface-border">
        <div className="container-max flex h-14 items-center justify-between gap-4">
          {/* Navigation desktop */}
          <nav className="hidden gap-1 md:flex">
            {NAV_LINKS.map((link) => {
              const active = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    active
                      ? 'bg-brand/10 text-brand font-semibold'
                      : 'text-text-secondary hover:bg-slate-50 hover:text-text-primary'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {!checked ? (
              <div className="h-9 w-24 skeleton rounded-full" />
            ) : user ? (
              <>
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
                  >
                    <span>⚙️</span>
                    <span>Quản trị</span>
                  </Link>
                )}

                <Link
                  href="/dang-tin"
                  className="btn-primary text-xs px-4 py-2 hidden sm:inline-flex"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Đăng tin
                </Link>

                {/* Avatar dropdown */}
                <div className="relative">
                  <button
                    id="user-menu-button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="flex items-center gap-2 rounded-full border border-surface-border bg-white px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">
                      {initials}
                    </span>
                    <svg className="h-3.5 w-3.5 text-text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </button>

                  {menuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                      <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-surface-border bg-white py-2 shadow-modal animate-slide-down">
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
                          { href: '/gia-thanh-vien', label: 'Gói thành viên', icon: '⭐' },
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
                            {item.label}
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
                            Đăng xuất
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
                  href="/dang-nhap"
                  className="hidden text-sm font-medium text-text-secondary hover:text-brand transition-colors sm:block"
                >
                  Đăng nhập
                </Link>
                <Link href="/dang-tin" className="btn-primary text-xs px-4 py-2">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  Đăng tin
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              id="mobile-menu-button"
              onClick={() => setMobileOpen((v) => !v)}
              className="ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-slate-50 md:hidden"
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

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="border-t border-surface-border bg-white pb-4 animate-slide-down md:hidden">
            <div className="container-max pt-2 space-y-0.5">
              {NAV_LINKS.map((link) => {
                const active = isLinkActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                      active ? 'bg-brand/10 text-brand' : 'text-text-secondary hover:bg-slate-50'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {user && (
                <>
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="flex items-center justify-center gap-2 rounded-xl bg-slate-900 text-white font-bold py-3 text-sm mt-2"
                    >
                      <span>⚙️</span>
                      <span>Vào Trang Quản trị</span>
                    </Link>
                  )}
                  <Link href="/dang-tin" className="btn-primary w-full mt-2 justify-center">
                    + Đăng tin mới
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
