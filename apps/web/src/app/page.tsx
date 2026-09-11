import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchListings } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import {
  DEMO_ROOM_RENT_LISTINGS,
  DEMO_CAN_HO_RENT_LISTINGS,
  DEMO_STUDIO_RENT_LISTINGS,
  DEMO_SPACE_RENT_LISTINGS,
} from '@/lib/demo-data';

export const metadata: Metadata = {
  title: 'BĐS Cho Thuê — Nền tảng tìm căn hộ, studio & phòng trọ số 1',
  description:
    'Tìm căn hộ, studio, phòng trọ sinh viên và nhà cho thuê giá tốt nhất. Minh bạch chi phí điện nước, tìm kiếm theo trường Đại học, liên hệ trực tiếp chính chủ.',
};

const QUICK_CATEGORIES = [
  { href: '/thue?categoryGroup=thue_can_ho', icon: '🏢', label: 'Căn hộ' },
  { href: '/thue?categoryGroup=thue_studio', icon: '🛋️', label: 'Studio' },
  { href: '/cho-thue-tro', icon: '🛏️', label: 'Phòng trọ sinh viên' },
  { href: '/thue?propertyType=nha_rieng', icon: '🏠', label: 'Nhà nguyên căn' },
  { href: '/cho-thue-mat-bang', icon: '🏪', label: 'Mặt bằng kinh doanh' },
];

const UNIVERSITY_SHORTCUTS = [
  { href: '/thue?universitySlug=dhqg-tphcm', label: 'ĐHQG TP.HCM' },
  { href: '/thue?universitySlug=dh-bach-khoa-tphcm', label: 'ĐH Bách Khoa HCM' },
  { href: '/thue?universitySlug=dh-kinh-te-tphcm', label: 'ĐH Kinh tế (UEH)' },
  { href: '/thue?universitySlug=dh-ton-duc-thang', label: 'ĐH Tôn Đức Thắng' },
  { href: '/thue?universitySlug=dhqg-ha-noi', label: 'ĐHQG Hà Nội' },
  { href: '/thue?universitySlug=dh-kinh-te-quoc-dan', label: 'ĐH Kinh tế Quốc dân' },
  { href: '/thue?universitySlug=dh-bach-khoa-ha-noi', label: 'ĐH Bách Khoa HN' },
];

const VALUE_PROPOSITIONS = [
  {
    icon: '⚡💧',
    title: 'Minh bạch chi phí ẩn',
    desc: 'Đơn giá điện đ/kWh, nước đ/m3 hoặc gói bao điện nước hiển thị rõ ràng, không lo chi phí phát sinh.',
    color: 'from-teal-500/10 to-teal-500/5',
    border: 'border-teal-200',
  },
  {
    icon: '🎓',
    title: 'Lọc theo Trường Đại học',
    desc: 'Tìm phòng trọ, ký túc xá theo từng trường ĐH, hiển thị khoảng cách mét và thời gian di chuyển thực tế.',
    color: 'from-blue-500/10 to-blue-500/5',
    border: 'border-blue-200',
  },
  {
    icon: '📞',
    title: 'Liên hệ chính chủ trực tiếp',
    desc: 'Bấm xem số điện thoại và kết nối Zalo trực tiếp với chủ trọ/môi giới. Sàn không thu phí cọc hay phí môi giới.',
    color: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-200',
  },
  {
    icon: '💰',
    title: 'Dự trù chi phí dọn vào',
    desc: 'Công cụ tính tổng tiền cọc + tháng đầu + phí dịch vụ giúp sinh viên và người thuê chủ động tài chính.',
    color: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-200',
  },
];

export default async function HomePage() {
  let roomListings: Awaited<ReturnType<typeof fetchListings>> | null = null;
  let apartmentListings: Awaited<ReturnType<typeof fetchListings>> | null = null;
  let studioListings: Awaited<ReturnType<typeof fetchListings>> | null = null;
  let spaceListings: Awaited<ReturnType<typeof fetchListings>> | null = null;

  try {
    [roomListings, apartmentListings, studioListings, spaceListings] = await Promise.all([
      fetchListings({ categoryGroup: 'thue_tro', pageSize: '4' }),
      fetchListings({ categoryGroup: 'thue_can_ho', pageSize: '4' }),
      fetchListings({ categoryGroup: 'thue_studio', pageSize: '4' }),
      fetchListings({ categoryGroup: 'thue_mat_bang', pageSize: '4' }),
    ]);
  } catch {
    // API offline fallback
  }

  const roomItems = (roomListings?.items?.length ?? 0) > 0 ? roomListings!.items : DEMO_ROOM_RENT_LISTINGS;
  const aptItems = (apartmentListings?.items?.length ?? 0) > 0 ? apartmentListings!.items : DEMO_CAN_HO_RENT_LISTINGS;
  const studioItems = (studioListings?.items?.length ?? 0) > 0 ? studioListings!.items : DEMO_STUDIO_RENT_LISTINGS;
  const spaceItems = (spaceListings?.items?.length ?? 0) > 0 ? spaceListings!.items : DEMO_SPACE_RENT_LISTINGS;

  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="hero-pattern">
        <div className="container-max py-14 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand ring-1 ring-brand/20">
              🔑 Sàn trung gian Cho thuê BĐS — Kết nối trực tiếp Chủ trọ & Sinh viên
            </div>
            <h1 className="text-4xl font-bold leading-tight text-text-primary md:text-5xl lg:text-[3.25rem]">
              Tìm phòng trọ & nhà cho thuê{' '}
              <span className="bg-gradient-to-r from-brand to-brand-700 bg-clip-text text-transparent">
                Minh bạch chi phí
              </span>
            </h1>
            <p className="mt-4 text-base text-text-secondary md:text-lg">
              Giải pháp tìm phòng trọ sinh viên, studio và căn hộ có cấu trúc, lọc theo trường đại học,
              <br className="hidden md:block" />
              công khai giá điện nước và liên hệ trực tiếp chủ nhà — 100% miễn phí người thuê.
            </p>

            {/* Search bar & Tabs */}
            <div className="mt-8">
              {/* Tabs chuyên mục thuê */}
              <div className="mb-0 flex justify-center">
                <div className="inline-flex rounded-t-xl overflow-hidden border-b-0 flex-wrap">
                  <Link
                    href="/thue?categoryGroup=thue_can_ho"
                    className="bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand border-x border-t border-surface-border rounded-tl-xl hover:bg-slate-50 transition-colors"
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

              <form
                action="/thue"
                className="flex overflow-hidden rounded-b-2xl rounded-tr-2xl border border-surface-border bg-white shadow-elevated"
              >
                <input
                  name="keyword"
                  placeholder="Nhập tên trường ĐH (VD: Bách Khoa, ĐHQG...), quận/huyện, hoặc từ khóa..."
                  className="flex-1 px-5 py-4 text-sm text-text-primary placeholder:text-text-muted outline-none"
                />
                <button
                  type="submit"
                  id="hero-search-button"
                  className="flex items-center gap-2 bg-brand px-7 font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                  </svg>
                  Tìm phòng ngay
                </button>
              </form>
            </div>

            {/* Quick university shortcuts */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="text-text-muted font-medium">🎓 Gần trường ĐH:</span>
              {UNIVERSITY_SHORTCUTS.map((uni) => (
                <Link
                  key={uni.href}
                  href={uni.href}
                  className="rounded-full bg-white px-3 py-1 font-medium text-text-secondary shadow-sm ring-1 ring-surface-border hover:ring-brand hover:text-brand transition-all"
                >
                  {uni.label}
                </Link>
              ))}
            </div>

            {/* Quick category pills */}
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {QUICK_CATEGORIES.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="flex items-center gap-1.5 rounded-full bg-white/80 px-3.5 py-1.5 text-xs font-medium text-text-secondary shadow-card ring-1 ring-surface-border hover:ring-brand hover:text-brand transition-all"
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </Link>
              ))}
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {roomItems.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {aptItems.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {studioItems.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
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
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {spaceItems.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
