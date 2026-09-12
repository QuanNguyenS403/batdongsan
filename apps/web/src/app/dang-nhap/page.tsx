'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Step = 'phone' | 'login-password' | 'register-otp' | 'register-info' | 'forgot-password';

function formatFriendlyError(err: unknown): string {
  const msg = (err as Error)?.message || 'Đã có lỗi xảy ra, vui lòng thử lại sau.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('network') || msg.includes('ENOTFOUND')) {
    return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại sau.';
  }
  return msg;
}

function getSafeReturnUrl(rawUrl: string | null): string {
  if (!rawUrl) return '/';
  // Chỉ chấp nhận relative URL bắt đầu bằng 1 dấu '/' duy nhất (chống open redirect //attacker.com)
  if (rawUrl.startsWith('/') && !rawUrl.startsWith('//')) {
    return rawUrl;
  }
  return '/';
}

function DangNhapContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnToParam = searchParams.get('returnTo');
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheckPhone(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/check-phone?phone=${encodeURIComponent(phone)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Không kiểm tra được số điện thoại.');

      if (data.exists) {
        setStep('login-password');
      } else {
        await handleSendOtpForRegister();
      }
    } catch (err) {
      setError(formatFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Đăng nhập thất bại.');

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      router.push(getSafeReturnUrl(returnToParam));
    } catch (err) {
      setError(formatFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleSendOtpForRegister() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Gửi OTP thất bại.');
      setStep('register-otp');
    } catch (err) {
      setError(formatFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleStartForgotPassword() {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Không thể gửi mã OTP.');
      setStep('forgot-password');
      setOtpCode('');
      setNewPassword('');
    } catch (err) {
      setError(formatFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otpCode, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Đặt lại mật khẩu thất bại.');

      setSuccessMsg('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.');
      setStep('login-password');
      setPassword('');
    } catch (err) {
      setError(formatFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otpCode, fullName, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Đăng ký thất bại.');

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('access_token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      router.push(getSafeReturnUrl(returnToParam));
    } catch (err) {
      setError(formatFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-surface-border bg-white p-7 shadow-elevated">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-xl text-brand mb-3">
            🔐
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Đăng nhập / Đăng ký</h1>
          <p className="mt-1 text-xs text-text-secondary">
            Xác thực bằng số điện thoại (OTP). Ở môi trường dev, mã OTP hiển thị trong console log server.
          </p>
        </div>

        {successMsg && (
          <div className="mt-4 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center text-xs font-medium text-emerald-700">
            {successMsg}
          </div>
        )}

        {step === 'phone' && (
          <form onSubmit={handleCheckPhone} className="mt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">Số điện thoại</label>
              <input
                required
                type="tel"
                placeholder="Ví dụ: 0901234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Đang kiểm tra...' : 'Tiếp tục'}
            </button>
          </form>
        )}

        {step === 'login-password' && (
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>SĐT: <b className="text-text-primary">{phone}</b></span>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="font-semibold text-brand hover:text-brand-700 hover:underline"
              >
                Đổi SĐT
              </button>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">Mật khẩu</label>
              <input
                required
                type="password"
                placeholder="Nhập mật khẩu của bạn"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleStartForgotPassword}
                disabled={loading}
                className="text-xs font-medium text-text-muted hover:text-brand hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        )}

        {step === 'forgot-password' && (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Khôi phục: <b className="text-text-primary">{phone}</b></span>
              <button
                type="button"
                onClick={() => setStep('login-password')}
                className="font-semibold text-brand hover:text-brand-700 hover:underline"
              >
                Quay lại
              </button>
            </div>

            <p className="text-xs text-text-secondary">
              Mã OTP đã gửi tới {phone}. Vui lòng nhập mã và đặt mật khẩu mới:
            </p>

            <input
              required
              placeholder="Mã OTP (6 số)"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="input-field"
            />

            <input
              required
              type="password"
              placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
            />

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Đang đặt lại...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>
        )}

        {step === 'register-otp' && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-text-secondary">
              <span>Đăng ký mới: <b className="text-text-primary">{phone}</b></span>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="font-semibold text-brand hover:text-brand-700 hover:underline"
              >
                Đổi SĐT
              </button>
            </div>

            <p className="text-xs text-text-secondary">Mã OTP đã được gửi tới số {phone}:</p>
            <input
              required
              placeholder="Mã OTP (6 số)"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="input-field"
            />
            <button
              type="button"
              onClick={() => {
                if (!otpCode.trim()) {
                  setError('Vui lòng nhập mã OTP.');
                  return;
                }
                setStep('register-info');
              }}
              className="btn-primary w-full"
            >
              Tiếp tục
            </button>
          </div>
        )}

        {step === 'register-info' && (
          <form onSubmit={handleRegister} className="mt-6 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">Họ và tên</label>
              <input
                required
                placeholder="Họ và tên của bạn"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">Mật khẩu</label>
              <input
                required
                type="password"
                placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
            </button>
          </form>
        )}

        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-3 text-center text-xs font-medium text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default function DangNhapPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-4 py-16 text-center text-sm text-text-muted">Đang tải...</div>}>
      <DangNhapContent />
    </Suspense>
  );
}
