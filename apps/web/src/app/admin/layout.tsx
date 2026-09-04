'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { authFetch, clearTokens, getAccessToken } from '@/lib/auth-client';

interface AdminUser {
  id: string;
  phone: string;
  fullName: string | null;
  role: string;
}

interface BadgeCounts {
  pendingListings: number;
  newReports: number;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState<BadgeCounts>({ pendingListings: 0, newReports: 0 });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      if (!getAccessToken()) {
        setLoading(false);
        return;
      }

      try {
        const res = await authFetch('/auth/me');
        if (!res.ok) throw new Error('Unauthorized');
        const data = await res.json();
        if (data.role === 'admin') {
          setUser(data);
          // Lấy số liệu badges
          try {
            const dashRes = await authFetch('/admin/dashboard');
            if (dashRes.ok) {
              const dashData = await dashRes.json();
              setBadges({
                pendingListings: dashData.stats?.pendingListingsCount ?? 0,
                newReports: dashData.stats?.newReportsCount ?? 0,
              });
            }
          } catch {
            // bỏ qua lỗi badges phụ
          }
        }
      } catch {
        clearTokens();
      } finally {
        setLoading(false);
      }
    }

    checkAdmin();
  }, [pathname]);

  function handleLogout() {
    clearTokens();
    setUser(null);
    router.push('/dang-nhap');
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-teal-600 border-r-transparent align-[-0.125em]" />
          <p className="mt-3 text-sm font-medium text-gray-600">Đang xác thực quyền Quản trị...</p>
        </div>
      </div>
    );
  }

  // Nếu chưa đăng nhập hoặc không phải admin
  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            🔒
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Yêu cầu quyền Quản trị viên</h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            Khu vực này chỉ dành riêng cho Ban Quản trị hệ thống BĐS. Bạn cần đăng nhập bằng tài khoản có vai trò Quản trị (Admin) để tiếp tục.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/dang-nhap?redirect=/admin"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-medium py-2.5 px-4 rounded-xl text-sm transition-colors text-center shadow-sm"
            >
              Đăng nhập Quản trị
            </Link>
            <Link
              href="/"
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-4 rounded-xl text-sm transition-colors text-center"
            >
              Về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      href: '/admin',
      label: 'Tổng quan',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      ),
      badge: null,
    },
    {
      href: '/admin/tin-cho-duyet',
      label: 'Duyệt tin đăng',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      badge: badges.pendingListings > 0 ? badges.pendingListings : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      href: '/admin/bao-cao-vi-pham',
      label: 'Báo cáo vi phạm',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      badge: badges.newReports > 0 ? badges.newReports : null,
      badgeColor: 'bg-rose-500 text-white',
    },
    {
      href: '/admin/nguoi-dung',
      label: 'Quản lý người dùng',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      badge: null,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar bên trái */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-64'
        }`}
      >
        {/* Header Logo của Admin */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500 text-white font-bold text-base shadow-sm">
              B
            </span>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-white leading-tight">
                BĐS<span className="text-teal-400 font-semibold">.Admin</span>
              </span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                Trung tâm Quản trị
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-slate-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        {/* Menu Điều hướng */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Nghiệp vụ Quản trị
          </div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={isActive ? 'text-white' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 text-xs font-bold rounded-full ${item.badgeColor ?? 'bg-teal-500 text-white'}`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          <div className="pt-6 text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Hệ thống
          </div>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>Xem trang người dùng</span>
          </Link>
        </div>

        {/* Footer Sidebar: User Profile & Đăng xuất */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-full bg-teal-600/30 border border-teal-500/50 text-teal-300 flex items-center justify-center font-bold text-sm shrink-0">
                {(user.fullName ?? user.phone).charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">
                  {user.fullName ?? 'Quản trị viên'}
                </p>
                <p className="text-xs text-slate-400 truncate">{user.phone}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-medium text-slate-500 hidden sm:inline">Hệ thống sẵn sàng</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/admin/tin-cho-duyet"
              className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-colors"
            >
              <span>Tin chờ duyệt:</span>
              <span className="font-bold">{badges.pendingListings}</span>
            </Link>
            <div className="h-4 w-px bg-slate-200" />
            <span className="text-xs text-slate-500">
              Xin chào, <strong className="text-slate-800">{user.fullName ?? user.phone}</strong>
            </span>
          </div>
        </header>

        {/* Nội dung trang con */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}
