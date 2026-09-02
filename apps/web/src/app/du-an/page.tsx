import type { Metadata } from 'next';
import { ComingSoonNotice } from '@/components/ComingSoonNotice';

export const metadata: Metadata = {
  title: 'Dự án bất động sản | Batdongsan',
  description: 'Danh sách dự án bất động sản sắp ra mắt.',
  robots: { index: false, follow: true }, // chưa có nội dung thật — không để Google index trang rỗng
};

export default function DuAnPage() {
  return (
    <ComingSoonNotice
      title="Danh sách dự án bất động sản"
      description="Trang liệt kê các dự án căn hộ/khu đô thị kèm chủ đầu tư, giá khởi điểm và các tin đăng liên quan."
    />
  );
}
