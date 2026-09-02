import type { Metadata } from 'next';
import { ComingSoonNotice } from '@/components/ComingSoonNotice';

export const metadata: Metadata = {
  title: 'Danh bạ môi giới | Batdongsan',
  description: 'Danh bạ môi giới bất động sản đã xác thực, sắp ra mắt.',
  robots: { index: false, follow: true },
};

export default function MoiGioiPage() {
  return (
    <ComingSoonNotice
      title="Danh bạ môi giới"
      description="Trang tìm kiếm môi giới bất động sản theo khu vực, kèm hồ sơ xác thực và số tin đang đăng."
    />
  );
}
