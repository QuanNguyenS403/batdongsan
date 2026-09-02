'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFetch, isLoggedIn } from '@/lib/auth-client';

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

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [fullNameInput, setFullNameInput] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Change password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

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
      .then((data: Profile) => {
        setProfile(data);
        setFullNameInput(data.fullName ?? '');
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileSaving(true);
    setProfileSuccess(null);
    setError(null);

    try {
      const res = await authFetch('/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullNameInput.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message?.toString() ?? 'Cập nhật thất bại.');

      setProfile((prev) => (prev ? { ...prev, fullName: data.fullName } : null));
      setProfileSuccess('Cập nhật họ và tên thành công!');
      setIsEditing(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có tối thiểu 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp.');
      return;
    }

    setPasswordSaving(true);
    try {
      const res = await authFetch('/users/me/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message?.toString() ?? 'Đổi mật khẩu thất bại.');

      setPasswordSuccess('Đổi mật khẩu thành công!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err) {
      setPasswordError((err as Error).message);
    } finally {
      setPasswordSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900">Thông tin tài khoản</h1>

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>}
      {profileSuccess && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{profileSuccess}</p>}
      {passwordSuccess && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{passwordSuccess}</p>}

      {profile && (
        <div className="mt-6 space-y-6">
          {/* Thông tin cá nhân */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-base font-bold text-gray-900">Hồ sơ cá nhân</h2>
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs font-semibold text-brand-dark hover:underline"
                >
                  Chỉnh sửa
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFullNameInput(profile.fullName ?? '');
                  }}
                  className="text-xs text-gray-500 hover:underline"
                >
                  Huỷ
                </button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Số điện thoại</label>
                  <input
                    disabled
                    value={profile.phone}
                    className="w-full rounded-xl border bg-gray-50 px-3 py-2 text-sm text-gray-500"
                  />
                  <span className="text-[11px] text-gray-400">Số điện thoại đăng ký không thể thay đổi</span>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Họ và tên</label>
                  <input
                    required
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    placeholder="Nhập họ và tên của bạn"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-brand-dark disabled:opacity-60"
                  >
                    {profileSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="mt-4 space-y-3">
                <Field label="Số điện thoại" value={profile.phone} />
                <Field label="Họ và tên" value={profile.fullName ?? '— Chưa cập nhật —'} />
                <Field label="Vai trò" value={profile.role === 'admin' ? 'Quản trị viên' : profile.role === 'broker' ? 'Môi giới' : 'Người dùng'} />
                <Field label="Ngày tham gia" value={new Date(profile.createdAt).toLocaleDateString('vi-VN')} />
              </div>
            )}
          </div>

          {/* Đổi mật khẩu */}
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900">Bảo mật & Mật khẩu</h2>
                <p className="mt-0.5 text-xs text-gray-500">Nên đặt mật khẩu mạnh để bảo vệ tài khoản và tin đăng</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(!showPasswordForm);
                  setPasswordError(null);
                }}
                className="rounded-xl border border-gray-200 px-3.5 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                {showPasswordForm ? 'Đóng' : 'Đổi mật khẩu'}
              </button>
            </div>

            {showPasswordForm && (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-3 border-t pt-4">
                {passwordError && <p className="text-xs text-red-600">{passwordError}</p>}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Mật khẩu hiện tại *</label>
                  <input
                    required
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang dùng"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Mật khẩu mới (tối thiểu 6 ký tự) *</label>
                  <input
                    required
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-600">Xác nhận mật khẩu mới *</label>
                  <input
                    required
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={passwordSaving}
                    className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-gray-900 hover:bg-brand-dark disabled:opacity-60"
                  >
                    {passwordSaving ? 'Đang xử lý...' : 'Xác nhận đổi mật khẩu'}
                  </button>
                </div>
              </form>
            )}
          </div>
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
