'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Step = 'phone' | 'login-password' | 'register-otp' | 'register-info';

export default function DangNhapPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCheckPhone(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      // TRƯỚC ĐÂY: bỏ qua bước kiểm tra, luôn nhảy thẳng vào màn hình nhập mật khẩu — người dùng
      // mới (chưa từng đăng ký) sẽ luôn nhận lỗi "sai mật khẩu" rất khó hiểu vì tài khoản còn
      // chưa tồn tại. Endpoint GET /auth/check-phone giờ đã có, dùng để tự động rẽ đúng nhánh
      // giống hệt UX thật của Mogi (SĐT cũ -> nhập mật khẩu; SĐT mới -> gửi OTP đăng ký).
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
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h1 className="text-center text-xl font-bold text-gray-900">Đăng nhập / Đăng ký</h1>
        <p className="mt-1 text-center text-xs text-gray-500">
          Xác thực bằng số điện thoại (OTP). Ở môi trường dev, mã OTP hiện trong log server API (SMS_PROVIDER=mock).
        </p>

        {step === 'phone' && (
          <form onSubmit={handleCheckPhone} className="mt-6 space-y-3">
            <input
              required
              placeholder="Số điện thoại"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-dark"
            >
              Tiếp tục
            </button>
          </form>
        )}

        {step === 'login-password' && (
          <form onSubmit={handleLogin} className="mt-6 space-y-3">
            <p className="text-sm text-gray-600">SĐT: {phone}</p>
            <input
              required
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-dark"
            >
              Đăng nhập
            </button>
          </form>
        )}

        {step === 'register-otp' && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-gray-600">Đã gửi OTP tới {phone}. Nhập mã bên dưới:</p>
            <input
              required
              placeholder="Mã OTP (6 số)"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm"
            />
            <button
              onClick={() => setStep('register-info')}
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
              placeholder="Họ và tên"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm"
            />
            <input
              required
              type="password"
              placeholder="Tạo mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border px-4 py-2.5 text-sm"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand py-2.5 text-sm font-semibold text-gray-900 hover:bg-brand-dark"
            >
              Hoàn tất đăng ký
            </button>
          </form>
        )}

        {error && <p className="mt-3 text-center text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
