'use client';

import { useEffect, useState } from 'react';
import { setTokens } from '@/lib/auth-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

type AuthStep = 'phone' | 'login-password' | 'register-otp' | 'google-phone';

export function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  subtitle = 'Đăng nhập ngay để liên hệ với người đăng tin',
}: AuthModalProps) {
  const [step, setStep] = useState<AuthStep>('phone');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [googleCredential, setGoogleCredential] = useState<string | null>(null);
  const [googleUser, setGoogleUser] = useState<{ email: string; name: string; picture: string } | null>(null);

  useEffect(() => {
    if (!isOpen || typeof window === 'undefined') return;
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
  }, [isOpen]);

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
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function triggerGoogleSignIn() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Vui lòng thêm NEXT_PUBLIC_GOOGLE_CLIENT_ID vào file .env để kích hoạt đăng nhập Google');
      return;
    }
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt();
    } else {
      setError('Đang tải thư viện Google, vui lòng thử lại sau 2 giây');
    }
  }

  if (!isOpen) return null;

  function resetState() {
    setStep('phone');
    setPhone('');
    setPassword('');
    setOtpCode('');
    setFullName('');
    setError(null);
    setDevOtp(null);
    setGoogleCredential(null);
    setGoogleUser(null);
    setLoading(false);
  }

  function handleClose() {
    resetState();
    onClose();
  }

  // Bước 1: Kiểm tra SĐT
  async function handleContinuePhone(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 9) {
      setError('Vui lòng nhập số điện thoại hợp lệ (10 chữ số)');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/check-phone?phone=${encodeURIComponent(cleanPhone)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Không kiểm tra được số điện thoại');

      if (data.exists) {
        // Số đã có -> sang bước nhập mật khẩu
        setStep('login-password');
      } else {
        // Số chưa có -> gửi OTP để đăng ký
        await sendOtpForRegister(cleanPhone);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Gửi OTP cho đăng ký mới
  async function sendOtpForRegister(targetPhone: string) {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: targetPhone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Không thể gửi mã xác thực SMS');

      if (data.devOtp) {
        setDevOtp(data.devOtp);
      }
      setStep('register-otp');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Bước 2a: Đăng nhập
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Đăng nhập không thành công');

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Bước 2b: Hoàn tất đăng ký với OTP
  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\s+/g, '');
    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên của bạn');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu cần tối thiểu 6 ký tự');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          otpCode: otpCode.trim(),
          fullName: fullName.trim(),
          password,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? 'Đăng ký tài khoản thất bại');

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl transition-all">
        {/* Nút đóng góc trên bên phải */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Tiêu đề chuẩn Ảnh 1 */}
        <div>
          <p className="text-sm font-medium text-slate-700">Xin chào bạn!</p>
          <h2 className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">
            Đăng ký / đăng nhập để tiếp tục
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {subtitle}
          </p>
        </div>

        {/* Giao diện Bước 1: Nhập số điện thoại (Khớp 100% Ảnh 1) */}
        {step === 'phone' && (
          <div className="mt-6 space-y-5">
            {/* Nút Đăng nhập với Google */}
            <button
              type="button"
              onClick={() => {
                setError('Hệ thống khuyến khích đăng nhập/đăng ký bằng số điện thoại bên dưới để xác thực tài khoản bên cho thuê');
              }}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 active:scale-[0.99] transition-all"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Đăng nhập với Google</span>
            </button>

            {/* Phân cách 'Hoặc' */}
            <div className="relative flex items-center justify-center">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white px-3 text-xs font-medium text-slate-400">
                Hoặc
              </span>
            </div>

            {/* Form nhập số điện thoại */}
            <form onSubmit={handleContinuePhone} className="space-y-4">
              <div className="relative rounded-2xl border-2 border-slate-300 focus-within:border-[#4ecbc4] focus-within:ring-2 focus-within:ring-[#4ecbc4]/20 p-3 transition-all">
                <label className="block text-[11px] font-semibold text-slate-500">
                  Số điện thoại *
                </label>
                <input
                  type="tel"
                  autoFocus
                  required
                  placeholder="0912 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-transparent text-base font-medium text-slate-900 outline-none placeholder:text-slate-300 pt-0.5"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
              )}

              {/* Nút Tiếp tục màu ngọc/teal */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center rounded-2xl bg-[#7cd8ce] hover:bg-[#68cdc3] text-white py-3.5 px-4 text-base font-bold shadow-sm transition-all disabled:opacity-60 active:scale-[0.99]"
              >
                {loading ? 'Đang kiểm tra...' : 'Tiếp tục'}
              </button>

              <div className="relative my-4 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative bg-white px-3 text-xs text-slate-400">hoặc</div>
              </div>

              {/* Nút Đăng nhập 1-Click bằng Google (0đ) */}
              <button
                type="button"
                onClick={triggerGoogleSignIn}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-200 bg-white py-3 px-4 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 hover:border-slate-300 active:scale-[0.99]"
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
          </div>
        )}

        {/* Giao diện Bước 2a: Tài khoản đã có -> Nhập mật khẩu */}
        {step === 'login-password' && (
          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-600">
              <span>Số điện thoại: <strong>{phone}</strong></span>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="font-semibold text-brand hover:underline"
              >
                Đổi số
              </button>
            </div>

            <div className="rounded-2xl border-2 border-slate-300 focus-within:border-[#4ecbc4] p-3 transition-all">
              <label className="block text-[11px] font-semibold text-slate-500">
                Mật khẩu đăng nhập *
              </label>
              <input
                type="password"
                autoFocus
                required
                placeholder="Nhập mật khẩu..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-base font-medium text-slate-900 outline-none pt-0.5"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-[#7cd8ce] hover:bg-[#68cdc3] text-white py-3.5 px-4 text-base font-bold shadow-sm transition-all disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        )}

        {/* Giao diện Bước 2b: Đăng ký mới với OTP */}
        {step === 'register-otp' && (
          <form onSubmit={handleRegister} className="mt-6 space-y-3.5">
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3.5 py-2.5 text-xs text-emerald-800">
              <span>Đăng ký mới cho số: <strong>{phone}</strong></span>
              <button
                type="button"
                onClick={() => setStep('phone')}
                className="font-semibold text-emerald-700 hover:underline"
              >
                Đổi số
              </button>
            </div>

            {devOtp && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-2 text-center text-xs text-amber-800">
                Mã xác thực SMS thử nghiệm: <strong className="font-mono text-sm text-amber-900">{devOtp}</strong>
              </div>
            )}

            <div className="rounded-2xl border-2 border-slate-300 focus-within:border-[#4ecbc4] p-3 transition-all">
              <label className="block text-[11px] font-semibold text-slate-500">
                Mã xác thực OTP (6 số gửi qua SMS) *
              </label>
              <input
                type="text"
                autoFocus
                required
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                className="w-full bg-transparent font-mono text-base font-bold tracking-widest text-slate-900 outline-none pt-0.5"
              />
            </div>

            <div className="rounded-2xl border-2 border-slate-300 focus-within:border-[#4ecbc4] p-3 transition-all">
              <label className="block text-[11px] font-semibold text-slate-500">
                Họ & Tên của bạn *
              </label>
              <input
                type="text"
                required
                placeholder="VD: Nguyễn Văn An"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full bg-transparent text-base font-medium text-slate-900 outline-none pt-0.5"
              />
            </div>

            <div className="rounded-2xl border-2 border-slate-300 focus-within:border-[#4ecbc4] p-3 transition-all">
              <label className="block text-[11px] font-semibold text-slate-500">
                Tạo mật khẩu (tối thiểu 6 ký tự) *
              </label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent text-base font-medium text-slate-900 outline-none pt-0.5"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-[#7cd8ce] hover:bg-[#68cdc3] text-white py-3.5 px-4 text-base font-bold shadow-sm transition-all disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? 'Đang tạo tài khoản...' : 'Xác nhận & Hoàn tất'}
            </button>
          </form>
        )}

        {/* Giao diện Bước liên kết SĐT sau khi đăng nhập Google thành công */}
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
            <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              {googleUser?.picture ? (
                <img src={googleUser.picture} alt="" className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-bold text-blue-600">
                  G
                </div>
              )}
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{googleUser?.name || 'Tài khoản Google'}</p>
                <p className="text-xs text-slate-500 truncate">{googleUser?.email}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Nhập số điện thoại để chuyên viên Đức Quân liên hệ dẫn xem phòng (Miễn phí 100%, không cần mã OTP):
            </p>

            <div className="rounded-2xl border-2 border-slate-300 focus-within:border-[#4ecbc4] p-3 transition-all">
              <label className="block text-[11px] font-semibold text-slate-500">
                Số điện thoại liên hệ *
              </label>
              <input
                type="tel"
                autoFocus
                required
                placeholder="0912 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-transparent text-base font-medium text-slate-900 outline-none pt-0.5"
              />
            </div>

            {error && (
              <p className="text-xs text-red-500 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-2xl bg-[#7cd8ce] hover:bg-[#68cdc3] text-white py-3.5 px-4 text-base font-bold shadow-sm transition-all disabled:opacity-60 active:scale-[0.99]"
            >
              {loading ? 'Đang hoàn tất...' : 'Hoàn tất đăng nhập'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
