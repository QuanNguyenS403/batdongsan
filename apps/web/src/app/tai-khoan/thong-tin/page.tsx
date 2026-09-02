'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, isLoggedIn } from '@/lib/auth-client';

/**
 * "Thông tin tài khoản" — khác với /tai-khoan/tin-da-luu (backend chưa tồn tại), endpoint
 * GET /auth/me ĐÃ có sẵn và trả đủ dữ liệu cần thiết, nên trang này hiển thị dữ liệu THẬT
 * (chế độ chỉ xem) thay vì làm placeholder thuần — chỉ còn thiếu chức năng CHỈNH SỬA (cần thêm
 * PATCH /users/me ở module users, hiện users.module.ts mới có sẵn khung, chưa có endpoint cập
 * nhật hồ sơ) và Đổi mật khẩu — 2 việc này để lại đúng như roadmap README.md mục 14.
 */
interface Profile {
  id: string;
  phone: string;
  fullName: string | null;
  avatarUrl: string | null;
  role: string;
  createdAt: string;
}

export default function ThongTinTaiKhoanPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/dang-nhap');
      return;
    }
    authFetch('/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Không tải được thông tin tài khoản.');
        return res.json();
      })
      .then(setProfile)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Thông tin tài khoản</h1>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {profile && (
        <div className="mt-6 space-y-4 rounded-xl border bg-white p-6">
          <Field label="Số điện thoại" value={profile.phone} />
          <Field label="Họ và tên" value={profile.fullName ?? '— Chưa cập nhật —'} />
          <Field label="Vai trò" value={profile.role === 'admin' ? 'Quản trị viên' : 'Người dùng'} />
          <Field label="Ngày tham gia" value={new Date(profile.createdAt).toLocaleDateString('vi-VN')} />

          <p className="!mt-6 rounded-lg bg-gray-50 p-3 text-xs text-gray-500">
            Chức năng chỉnh sửa thông tin và đổi mật khẩu đang được phát triển (cần bổ sung
            <code className="mx-1 rounded bg-gray-200 px-1">PATCH /users/me</code>
            ở backend).
          </p>
        </div>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b pb-3 last:border-0 last:pb-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900">{value}</span>
    </div>
  );
}
