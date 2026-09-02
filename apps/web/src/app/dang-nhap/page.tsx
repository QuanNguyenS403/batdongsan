'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Step = 'phone' | 'login-password' | 'register-otp' | 'register-info' | 'forgot-password';

export default function DangNhapPage() {
  const router = useRouter();
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
      setError((err as Error).message);
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
      localStorage.setItem('refreshToken', data.refreshToken);
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
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
      setError((err as Error).message);
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
      setError((err as Error).message);
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
      setError((err as Error).message);
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
      localStorage.setItem('refreshToken', data.refreshToken);
      router.push('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-center text-xl font-bold text-gray-900">Đăng nhập / Đăng ký</h1>
        <p className="mt-1 text-center text-xs text-gray-500">
          Xác thực bằng số điện thoại (OTP). Ở môi trường dev, mã OTP hiện trong log server API (SMS_PROVIDER=mock).
        </p>

        {successMsg && <p className="mt-4 rounded-lg bg-green-50 p-3 text-center text-xs text-green-700">{successMsg}</p>}

        {step === 'phone' && (
          <form onSubmit={handleCheckPhone} className="mt-6 space-y-3">
            <input
              required
              placeholder="Số điện thoại của bạn"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? 'Đang kiểm tra...' : 'Tiếp tục'}
            </button>
          </form>
        )}

        {step === 'login-password' && (
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>SĐT: <b className="text-gray-900">{phone}</b></span>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-brand-dark hover:underline"
              >
                Đổi SĐT
              </button>
            </div>

            <input
              required
              type="password"
              placeholder="Nhập mật khẩu của bạn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleStartForgotPassword}
                disabled={loading}
                className="text-xs text-gray-500 hover:text-brand-dark hover:underline"
              >
                Quên mật khẩu?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        )}

        {step === 'forgot-password' && (
          <form onSubmit={handleResetPassword} className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Khôi phục mật khẩu: <b className="text-gray-900">{phone}</b></span>
              <button
                type="button"
                onClick={() => setStep('login-password')}
                className="text-brand-dark hover:underline"
              >
                Quay lại
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Đã gửi mã OTP tới {phone}. Vui lòng nhập mã và thiết lập mật khẩu mới:
            </p>

            <input
              required
              placeholder="Mã OTP (6 số)"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />

            <input
              required
              type="password"
              placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? 'Đang đặt lại...' : 'Xác nhận đổi mật khẩu'}
            </button>
          </form>
        )}

        {step === 'register-otp' && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Đăng ký mới: <b className="text-gray-900">{phone}</b></span>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="text-brand-dark hover:underline"
              >
                Đổi SĐT
              </button>
            </div>

            <p className="text-xs text-gray-500">Mã OTP đã được gửi tới số {phone}:</p>
            <input
              required
              placeholder="Mã OTP (6 số)"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
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
              className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-dark"
            >
              Tiếp tục
            </button>
          </div>
        )}

        {step === 'register-info' && (
          <form onSubmit={handleRegister} className="mt-6 space-y-3">
            <input
              required
              placeholder="Họ và tên của bạn"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
            <input
              required
              type="password"
              placeholder="Tạo mật khẩu (tối thiểu 6 ký tự)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-brand-dark"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-dark disabled:opacity-60"
            >
              {loading ? 'Đang đăng ký...' : 'Hoàn tất đăng ký'}
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-center text-xs text-red-600">{error}</p>}
      </div>
    </div>
  );
}
