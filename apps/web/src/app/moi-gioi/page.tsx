import type { Metadata } from 'next';
import { ComingSoonNotice } from '@/components/ComingSoonNotice';

export const metadata: Metadata = {
  title: 'Danh bạ Chủ trọ & Quản lý vận hành | QNS Thuê',
  description: 'Danh bạ chủ nhà trọ, ban quản trị toà nhà và đối tác cho thuê phòng đã xác thực danh tính',
  robots: { index: false, follow: true },
};

export default function MoiGioiPage() {
  return (
    <ComingSoonNotice
      title="Danh bạ Chủ trọ & Quản lý vận hành"
      description="Trang tìm kiếm và liên hệ trực tiếp với các chủ trọ uy tín, đơn vị vận hành căn hộ dịch vụ và quản lý toà nhà kèm huy hiệu xác thực số điện thoại/CCCD và danh sách phòng đang quản lý"
    />
  );
}
