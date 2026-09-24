import { Metadata } from 'next';
import { fetchPublicPlans, MembershipPlanItem, PricingSeasonItem } from '@/lib/api';
import { MembershipPricingClient } from './MembershipPricingClient';

export const metadata: Metadata = {
  title: 'Bảng Giá Gói Hội Viên Đăng Tin Cho Thuê | QNS Thuê',
  description:
    'Bảng giá gói thành viên đăng tin cho thuê phòng trọ, studio, căn hộ, mặt bằng — tiếp cận hàng chục ngàn người thuê mỗi tuần với chi phí tối ưu nhất',
  alternates: {
    canonical: '/gia-thanh-vien',
  },
  openGraph: {
    title: 'Bảng Giá Gói Hội Viên Đăng Tin Cho Thuê — QNS Thuê',
    description:
      'Gói thành viên linh hoạt theo số tin, hỗ trợ mùa cao điểm tựu trường, tối ưu tỷ lệ lấp đầy phòng trọ cho chủ trọ và bên cho thuê',
    url: '/gia-thanh-vien',
  },
};

const FALLBACK_PLANS: MembershipPlanItem[] = [
  {
    id: 1,
    name: 'Gói Dùng Thử',
    code: 'trial',
    description: 'Trải nghiệm miễn phí nền tảng, phù hợp với chủ phòng cá nhân có ít phòng',
    originalPrice: 0,
    currentPrice: 0,
    priceMultiplier: 1,
    durationDays: 30,
    maxActiveListings: 3,
    regionScope: 'Toàn quốc',
    isFeatured: false,
    isSurgeActive: false,
  },
  {
    id: 2,
    name: 'Gói Chủ Trọ Khởi Đầu',
    code: 'basic',
    description: 'Dành cho chủ nhà có từ 5 - 10 phòng trọ, tối ưu chi phí lấp đầy phòng nhanh chóng',
    originalPrice: 199000,
    currentPrice: 199000,
    priceMultiplier: 1,
    durationDays: 30,
    maxActiveListings: 10,
    regionScope: 'Toàn quốc',
    isFeatured: false,
    isSurgeActive: false,
  },
  {
    id: 3,
    name: 'Gói Chủ Trọ Chuyên Nghiệp',
    code: 'pro',
    description: 'Dành cho chủ chuỗi nhà trọ, chung cư mini, căn hộ dịch vụ quy mô vừa',
    originalPrice: 499000,
    currentPrice: 499000,
    priceMultiplier: 1,
    durationDays: 30,
    maxActiveListings: 30,
    regionScope: 'Toàn quốc',
    isFeatured: true,
    isSurgeActive: false,
  },
  {
    id: 4,
    name: 'Gói Môi Giới VIP',
    code: 'vip',
    description: 'Dành cho môi giới chuyên nghiệp và chuỗi căn hộ cho thuê quy mô lớn toàn khu vực',
    originalPrice: 999000,
    currentPrice: 999000,
    priceMultiplier: 1,
    durationDays: 30,
    maxActiveListings: 100,
    regionScope: 'Toàn quốc',
    isFeatured: false,
    isSurgeActive: false,
  },
];

export default async function MembershipPricingPage() {
  let plans: MembershipPlanItem[] = [];
  let activeSeason: PricingSeasonItem | null = null;
  let isFallback = false;

  try {
    const data = await fetchPublicPlans();
    if (data?.plans?.length) {
      plans = data.plans;
      activeSeason = data.activeSeason;
    } else if (process.env.NODE_ENV !== 'production') {
      plans = FALLBACK_PLANS;
      isFallback = true;
    }
  } catch {
    // Chỉ fallback ở môi trường dev/local để thuận tiện kiểm thử giao diện
    if (process.env.NODE_ENV !== 'production') {
      plans = FALLBACK_PLANS;
      isFallback = true;
    }
  }

  return (
    <main className="min-h-screen bg-slate-50/50">
      <MembershipPricingClient
        initialPlans={plans}
        activeSeason={activeSeason}
        isFallback={isFallback}
      />
    </main>
  );
}
