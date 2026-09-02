import type { Metadata } from 'next';
import { ComingSoonNotice } from '@/components/ComingSoonNotice';

export const metadata: Metadata = {
  title: 'Giá nhà đất theo khu vực | Batdongsan',
  description: 'Bảng giá nhà đất trung bình theo khu vực, cập nhật định kỳ — sắp ra mắt.',
  robots: { index: false, follow: true },
};

export default function GiaNhaDatPage() {
  return (
    <ComingSoonNotice
      title="Giá nhà đất theo khu vực"
      description="Bảng giá trung bình mỗi m² theo quận/huyện, tính từ dữ liệu tin đăng thật (bảng price_index) — xem chi tiết ở CLAUDE.md."
    />
  );
}
