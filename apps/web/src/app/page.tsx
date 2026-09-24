import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchListings } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { HeroSearchForm } from '@/components/HeroSearchForm';
import {
  DEMO_ROOM_RENT_LISTINGS,
  DEMO_CAN_HO_RENT_LISTINGS,
  DEMO_STUDIO_RENT_LISTINGS,
  DEMO_SPACE_RENT_LISTINGS,
} from '@/lib/demo-data';

export const metadata: Metadata = {
  title: 'QNS Thuê — Rõ chi phí, đúng người cho thuê',
  description:
    'Nền tảng tìm chỗ thuê minh bạch chi phí: phòng trọ sinh viên, studio, căn hộ, mặt bằng kinh doanh. Xem bảng chi phí trọn gói trước khi liên hệ, kết nối đúng bên có quyền cho thuê',
};

const VALUE_PROPOSITIONS = [
  {
    icon: '📋',
    title: 'Tin đăng xác thực, rõ ràng',
    desc: 'Hình ảnh thực tế, thông tin mô tả chi tiết, giá thuê và các chi phí dịch vụ được công khai minh bạch',
    color: 'from-teal-500/10 to-teal-500/5',
    border: 'border-teal-200',
  },
  {
    icon: '🔍',
    title: 'Tìm kiếm nhanh chóng, tiện lợi',
    desc: 'Dễ dàng lọc theo khu vực, mức giá, diện tích và loại hình phòng phù hợp với mọi nhu cầu sinh hoạt và ngân sách',
    color: 'from-blue-500/10 to-blue-500/5',
    border: 'border-blue-200',
  },
  {
    icon: '📞',
    title: 'Tư vấn và trực tiếp dẫn xem',
    desc: 'Chuyên viên Đức Quân tiếp nhận nhu cầu, tư vấn chi tiết và trực tiếp dẫn xem phòng thực tế tận nơi',
    color: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-200',
  },
  {
    icon: '🛡️',
    title: '100% Miễn phí cho người thuê',
    desc: 'Khách thuê không phải trả bất kỳ khoản phí môi giới nào, ký hợp đồng và thanh toán trực tiếp với bên có quyền cho thuê',
    color: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-200',
  },
];

export default async function HomePage() {
  const isProduction = process.env.NODE_ENV === 'production';
  let roomListings: Awaited<ReturnType<typeof fetchListings>> | null = null;
  let apartmentListings: Awaited<ReturnType<typeof fetchListings>> | null = null;
  let studioListings: Awaited<ReturnType<typeof fetchListings>> | null = null;
  let spaceListings: Awaited<ReturnType<typeof fetchListings>> | null = null;

  try {
    const [roomRes, aptRes, studioRes, spaceRes] = await Promise.allSettled([
      fetchListings({ categoryGroup: 'thue_tro', pageSize: '4' }),
      fetchListings({ categoryGroup: 'thue_can_ho', pageSize: '4' }),
      fetchListings({ categoryGroup: 'thue_studio', pageSize: '4' }),
      fetchListings({ categoryGroup: 'thue_mat_bang', pageSize: '4' }),
    ]);

    roomListings = roomRes.status === 'fulfilled' ? roomRes.value : null;
    apartmentListings = aptRes.status === 'fulfilled' ? aptRes.value : null;
    studioListings = studioRes.status === 'fulfilled' ? studioRes.value : null;
    spaceListings = spaceRes.status === 'fulfilled' ? spaceRes.value : null;
  } catch {
    // Không bao giờ để lỗi fetch làm sập toàn trang
  }

  // Ở Production (P0-04): Tuyệt đối KHÔNG fallback sang dữ liệu demo giả lập
  const roomItems = (roomListings?.items?.length ?? 0) > 0
    ? roomListings!.items
    : (isProduction ? [] : DEMO_ROOM_RENT_LISTINGS);

  const aptItems = (apartmentListings?.items?.length ?? 0) > 0
    ? apartmentListings!.items
    : (isProduction ? [] : DEMO_CAN_HO_RENT_LISTINGS);

  const studioItems = (studioListings?.items?.length ?? 0) > 0
    ? studioListings!.items
    : (isProduction ? [] : DEMO_STUDIO_RENT_LISTINGS);

  const spaceItems = (spaceListings?.items?.length ?? 0) > 0
    ? spaceListings!.items
    : (isProduction ? [] : DEMO_SPACE_RENT_LISTINGS);

  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="hero-pattern">
        <div className="container-max py-14 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand ring-1 ring-brand/20">
              QNS Thuê — Rõ chi phí, đúng người cho thuê
            </div>
            <h1 className="text-3xl font-bold tracking-normal text-text-primary sm:text-4xl md:text-5xl lg:text-[3.25rem] leading-[1.15] md:leading-[1.18]">
              <span className="block">Tìm chỗ thuê phù hợp,</span>
              <span className="mt-0.5 block bg-gradient-to-r from-brand to-brand-700 bg-clip-text pb-0.5 text-transparent sm:mt-0.5">
                rõ chi phí ngay từ đầu
              </span>
            </h1>
            <p className="mt-4 text-base text-text-secondary md:text-lg">
              Minh bạch giá thuê, tiền cọc, điện nước và vai trò người đăng — từ phòng trọ sinh viên, studio, căn hộ đến mặt bằng kinh doanh
            </p>

            {/* Search bar & Tabs */}
            <div className="mt-8">
              {/* Tabs chuyên mục thuê */}
              <div className="mb-0 flex justify-center">
                <div className="inline-flex rounded-t-xl overflow-hidden border-b-0 flex-wrap">
                  <Link
                    href="/"
                    className="bg-brand text-white px-5 py-2.5 text-xs sm:text-sm font-semibold border-x border-t border-brand rounded-tl-xl hover:bg-brand-700 transition-colors"
                  >
                    🏠 Trang chủ
                  </Link>
                  <Link
                    href="/thue?categoryGroup=thue_can_ho"
                    className="bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand border-r border-t border-surface-border hover:bg-slate-50 transition-colors"
                  >
                    🏢 Căn hộ
                  </Link>
                  <Link
                    href="/thue?categoryGroup=thue_studio"
                    className="bg-slate-50 px-5 py-2.5 text-xs sm:text-sm font-medium text-text-secondary border-r border-t border-surface-border hover:bg-white hover:text-brand transition-colors"
                  >
                    🛋️ Studio
                  </Link>
                  <Link
                    href="/cho-thue-tro"
                    className="bg-slate-50 px-5 py-2.5 text-xs sm:text-sm font-medium text-text-secondary border-r border-t border-surface-border hover:bg-white hover:text-brand transition-colors"
                  >
                    🛏️ Phòng trọ SV
                  </Link>
                  <Link
                    href="/cho-thue-mat-bang"
                    className="bg-slate-50 px-5 py-2.5 text-xs sm:text-sm font-medium text-text-secondary border-r border-t border-surface-border rounded-tr-xl hover:bg-white hover:text-brand transition-colors"
                  >
                    🏪 Mặt bằng kinh doanh
                  </Link>
                </div>
              </div>

              <HeroSearchForm />
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 Value Proposition Cards ── */}
      <section className="border-b border-surface-border bg-white">
        <div className="container-max py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUE_PROPOSITIONS.map((card, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-4 rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} p-5 transition-all hover:shadow-elevated hover:-translate-y-0.5`}
              >
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <p className="font-semibold text-text-primary text-sm">{card.title}</p>
                  <p className="mt-1 text-xs text-text-secondary leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tin đăng nổi bật ── */}
      <section className="container-max py-12 space-y-14">
        {/* Section 1: Phòng trọ sinh viên & KTX */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-100 text-teal-800 text-xs">
                  🛏️
                </span>
                <h2 className="text-xl font-bold text-text-primary">Phòng trọ sinh viên & Ký túc xá nổi bật</h2>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Giá tốt từ 1.5 - 4 triệu/tháng, gần các trường đại học, giờ giấc tự do
              </p>
            </div>
            <Link
              href="/cho-thue-tro"
              className="flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-700 transition-colors"
            >
              Xem tất cả
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
          {roomItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {roomItems.slice(0, 4).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
              Hiện chưa có tin đăng nào trong chuyên mục này
            </div>
          )}
        </div>

        {/* Section 2: Căn hộ */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-100 text-blue-800 text-xs">
                  🏢
                </span>
                <h2 className="text-xl font-bold text-text-primary">Căn hộ cho thuê tiện nghi</h2>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Đầy đủ nội thất, view thoáng mát, an ninh cho người đi làm & gia đình
              </p>
            </div>
            <Link
              href="/thue?categoryGroup=thue_can_ho"
              className="flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-700 transition-colors"
            >
              Xem tất cả
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
          {aptItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {aptItems.slice(0, 4).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
              Hiện chưa có tin đăng nào trong chuyên mục này.
            </div>
          )}
        </div>

        {/* Section 3: Studio */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-100 text-indigo-800 text-xs">
                  🛋️
                </span>
                <h2 className="text-xl font-bold text-text-primary">Studio cho thuê cao cấp</h2>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Studio ban công, duplex gác lửng, full nội thất hiện đại cho người đi làm & chuyên gia
              </p>
            </div>
            <Link
              href="/thue?categoryGroup=thue_studio"
              className="flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-700 transition-colors"
            >
              Xem tất cả
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
          {studioItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {studioItems.slice(0, 4).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
              Hiện chưa có tin đăng nào trong chuyên mục này.
            </div>
          )}
        </div>

        {/* Section 3: Mặt bằng kinh doanh */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-rose-100 text-rose-800 text-xs">
                  🏪
                </span>
                <h2 className="text-xl font-bold text-text-primary">Mặt bằng kinh doanh & Cửa hàng</h2>
              </div>
              <p className="mt-1 text-xs text-text-muted">
                Mặt phố kinh doanh, vỉa hè rộng, shophouse khối đế lưu lượng người qua lại cao
              </p>
            </div>
            <Link
              href="/cho-thue-mat-bang"
              className="flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-700 transition-colors"
            >
              Xem tất cả
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
          {spaceItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {spaceItems.slice(0, 4).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center text-sm text-slate-500">
              Hiện chưa có tin đăng nào trong chuyên mục này.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
