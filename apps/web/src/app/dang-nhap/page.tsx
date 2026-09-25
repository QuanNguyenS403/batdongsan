'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setTokens } from '@/lib/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

type Step = 'phone' | 'login-password' | 'register-otp' | 'register-info' | 'forgot-password' | 'google-phone';

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
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string; picture: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const handleCallback = (response: any) => {
      if (response?.credential) {
        handleGoogleLogin(response.credential);
      }
    };

    if (!(window as any).google?.accounts?.id) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        (window as any).google?.accounts?.id?.initialize({
          client_id: clientId,
          callback: handleCallback,
        });
      };
      document.body.appendChild(script);
    } else {
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCallback,
      });
    }
  }, []);

  async function handleGoogleLogin(credential: string, userPhone?: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential,
          phone: userPhone ? userPhone.trim().replace(/\s+/g, '') : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Đăng nhập Google thất bại');

      if (data.needPhone) {
        setGoogleCredential(credential);
        setGoogleUser(data.googleUser);
        setStep('google-phone');
        return;
      }

      setTokens(data.accessToken, data.refreshToken);
      const safeUrl = getSafeReturnUrl(returnToParam);
      router.push(safeUrl);
    } catch (err) {
      setError(formatFriendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  function triggerGoogleSignIn() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Vui lòng cấu hình NEXT_PUBLIC_GOOGLE_CLIENT_ID để kích hoạt đăng nhập Google');
      return;
    }
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    } else {
      setError('Đang tải thư viện Google, vui lòng thử lại sau 2 giây');
    }
  }

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

      setTokens(data.accessToken, data.refreshToken);
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

      setTokens(data.accessToken, data.refreshToken);
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

            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative bg-white px-3 text-xs text-text-secondary">hoặc</div>
            </div>

            <button
              type="button"
              onClick={triggerGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white py-2.5 px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-400 active:scale-[0.99]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.99 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Đăng nhập nhanh bằng Google (0đ)</span>
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
                  setError('Vui lòng nhập mã OTP');
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

        {step === 'google-phone' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (googleCredential) {
                handleGoogleLogin(googleCredential, phone);
              }
            }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              {googleUser?.picture ? (
                <img src={googleUser.picture} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                  G
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-text-primary truncate">{googleUser?.name || 'Tài khoản Google'}</p>
                <p className="text-xs text-text-secondary truncate">{googleUser?.email}</p>
              </div>
            </div>

            <p className="text-xs text-text-secondary">
              Nhập số điện thoại để chuyên viên Đức Quân liên hệ dẫn xem phòng (Miễn phí 100%, không cần mã OTP):
            </p>

            <div>
              <label className="mb-1 block text-xs font-semibold text-text-secondary">Số điện thoại liên hệ *</label>
              <input
                required
                type="tel"
                autoFocus
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
              {loading ? 'Đang hoàn tất...' : 'Hoàn tất đăng nhập'}
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
