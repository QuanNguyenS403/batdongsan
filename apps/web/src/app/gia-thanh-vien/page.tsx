import { Metadata } from 'next';
import { MembershipPricingClient } from './MembershipPricingClient';

export const metadata: Metadata = {
  title: 'Chính Sách Phí Dịch Vụ Môi Giới Cho Thuê | QNS Thuê',
  description:
    'Đăng tin và dẫn xem phòng hoàn toàn miễn phí, người thuê 0 đồng, chủ nhà chỉ thanh toán 40% phí dịch vụ khi phòng được thuê thành công',
  alternates: {
    canonical: '/gia-thanh-vien',
  },
  openGraph: {
    title: 'Chính Sách Phí Dịch Vụ Môi Giới Cho Thuê — QNS Thuê',
    description:
      'Đăng tin và dẫn xem phòng hoàn toàn miễn phí, người thuê 0 đồng, chủ nhà chỉ thanh toán 40% phí dịch vụ khi phòng được thuê thành công',
    url: '/gia-thanh-vien',
  },
};

export default async function MembershipPricingPage() {
  return (
    <main className="min-h-screen bg-slate-50/50">
      <MembershipPricingClient />
    </main>
  );
}
