import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập / Đăng ký',
  description:
    'Đăng nhập hoặc tạo tài khoản để đăng tin bất động sản, lưu tin yêu thích và xem số điện thoại người đăng',
  robots: { index: false, follow: false }, // trang auth không cần SEO index
};

export default function DangNhapLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
