import Link from 'next/link';
import type { Metadata } from 'next';
import { fetchListings } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { DEMO_SALE_LISTINGS, DEMO_RENT_LISTINGS } from '@/lib/demo-data';

export const metadata: Metadata = {
  title: 'BatDongSan.vn — Mua bán, cho thuê nhà đất toàn quốc',
  description:
    'Tìm kiếm hàng nghìn tin mua bán, cho thuê nhà đất, căn hộ, đất nền uy tín trên toàn quốc. Cập nhật liên tục, miễn phí tra cứu.',
};


const QUICK_CATEGORIES = [
  { href: '/mua-ban', icon: '🏠', label: 'Bán bất động sản' },
  { href: '/thue', icon: '🔑', label: 'Cho thuê bất động sản' },
  { href: '/thue?propertyType=phong_tro', icon: '🛏️', label: 'Cho thuê trọ' },
  { href: '/thue?propertyType=mat_bang', icon: '🏪', label: 'Cho thuê mặt bằng' },
];

const FEATURE_CARDS = [
  {
    href: '/mua-ban',
    icon: '🏡',
    title: 'Bán Bất Động Sản',
    desc: 'Nhà riêng, đất nền, căn hộ pháp lý chuẩn, giá trực tiếp chính chủ',
    color: 'from-teal-500/10 to-teal-500/5',
    border: 'border-teal-200',
  },
  {
    href: '/thue',
    icon: '🔑',
    title: 'Cho Thuê Bất Động Sản',
    desc: 'Căn hộ chung cư, nhà nguyên căn đầy đủ tiện nghi, vị trí đẹp',
    color: 'from-blue-500/10 to-blue-500/5',
    border: 'border-blue-200',
  },
  {
    href: '/thue?propertyType=phong_tro',
    icon: '🛏️',
    title: 'Cho Thuê Phòng Trọ',
    desc: 'Phòng trọ khép kín, sạch sẽ, giờ giấc tự do, an ninh đảm bảo',
    color: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-200',
  },
  {
    href: '/thue?propertyType=mat_bang',
    icon: '🏪',
    title: 'Cho Thuê Mặt Bằng',
    desc: 'Mặt bằng kinh doanh phố lớn, vỉa hè rộng, tiềm năng thương mại cao',
    color: 'from-rose-500/10 to-rose-500/5',
    border: 'border-rose-200',
  },
];

export default async function HomePage() {
  let saleListings: Awaited<ReturnType<typeof fetchListings>> | null = null;
  let rentListings: Awaited<ReturnType<typeof fetchListings>> | null = null;
  let errorMessage: string | null = null;

  try {
    [saleListings, rentListings] = await Promise.all([
      fetchListings({ transactionType: 'sale', pageSize: '4' }),
      fetchListings({ transactionType: 'rent', pageSize: '4' }),
    ]);
  } catch {
    errorMessage = 'Chưa kết nối được tới API — kiểm tra apps/api đã chạy chưa.';
  }

  const saleItems = (saleListings?.items?.length ?? 0) > 0 ? saleListings!.items : DEMO_SALE_LISTINGS;
  const rentItems = (rentListings?.items?.length ?? 0) > 0 ? rentListings!.items : DEMO_RENT_LISTINGS;
  const isSaleDemo = (saleListings?.items?.length ?? 0) === 0;
  const isRentDemo = (rentListings?.items?.length ?? 0) === 0;

  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="hero-pattern">
        <div className="container-max py-14 lg:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand/10 px-4 py-1.5 text-xs font-semibold text-brand ring-1 ring-brand/20">
              🏡 Bất động sản Nguyễn Đức Quân — Hotline/Zalo: 0981 753 082
            </div>
            <h1 className="text-4xl font-bold leading-tight text-text-primary md:text-5xl lg:text-[3.25rem]">
              Bán & Cho thuê{' '}
              <span className="bg-gradient-to-r from-brand to-brand-700 bg-clip-text text-transparent">
                Bất động sản uy tín
              </span>
            </h1>
            <p className="mt-4 text-base text-text-secondary md:text-lg">
              Chuyên Bán BĐS, Cho thuê BĐS, Cho thuê phòng trọ & Cho thuê mặt bằng kinh doanh.
              <br className="hidden md:block" />
              Thông tin minh bạch, tư vấn tận tâm trực tiếp từ chính chủ.
            </p>

            {/* Search bar */}
            <div className="mt-8">
              {/* Tabs */}
              <div className="mb-0 flex justify-center">
                <div className="inline-flex rounded-t-xl overflow-hidden border-b-0 flex-wrap">
                  <Link
                    href="/mua-ban"
                    className="bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-brand border-x border-t border-surface-border rounded-tl-xl"
                  >
                    🏠 Bán BĐS
                  </Link>
                  <Link
                    href="/thue"
                    className="bg-slate-50 px-5 py-2.5 text-xs sm:text-sm font-medium text-text-secondary border-r border-t border-surface-border hover:bg-white hover:text-brand transition-colors"
                  >
                    🔑 Cho thuê BĐS
                  </Link>
                  <Link
                    href="/thue?propertyType=phong_tro"
                    className="bg-slate-50 px-5 py-2.5 text-xs sm:text-sm font-medium text-text-secondary border-r border-t border-surface-border hover:bg-white hover:text-brand transition-colors"
                  >
                    🛏️ Cho thuê trọ
                  </Link>
                  <Link
                    href="/thue?propertyType=mat_bang"
                    className="bg-slate-50 px-5 py-2.5 text-xs sm:text-sm font-medium text-text-secondary border-r border-t border-surface-border rounded-tr-xl hover:bg-white hover:text-brand transition-colors"
                  >
                    🏪 Cho thuê mặt bằng
                  </Link>
                </div>
              </div>

              <form
                action="/mua-ban"
                className="flex overflow-hidden rounded-b-2xl rounded-tr-2xl border border-surface-border bg-white shadow-elevated"
              >
                <input
                  name="keyword"
                  placeholder="Nhập khu vực, loại hình BĐS, mức giá cần tìm..."
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
                  Tìm kiếm
                </button>
              </form>
            </div>

            {/* Loại BĐS nhanh */}
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {QUICK_CATEGORIES.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-medium text-text-secondary shadow-card ring-1 ring-surface-border hover:ring-brand hover:text-brand transition-all"
                >
                  <span>{cat.icon}</span>
                  {cat.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 4 Feature Cards Dịch vụ ── */}
      <section className="border-b border-surface-border bg-white">
        <div className="container-max py-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className={`flex items-start gap-4 rounded-2xl border ${card.border} bg-gradient-to-br ${card.color} p-5 transition-all hover:shadow-elevated hover:-translate-y-0.5`}
              >
                <span className="text-2xl">{card.icon}</span>
                <div>
                  <p className="font-semibold text-text-primary">{card.title}</p>
                  <p className="mt-0.5 text-xs text-text-secondary leading-relaxed">{card.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tin đăng ── */}
      <section className="container-max py-12 space-y-12">
        {/* Tin bán */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Nhà đất bán mới nhất</h2>
              <p className="mt-0.5 text-sm text-text-muted">
                {isSaleDemo ? 'Bất động sản mua bán nổi bật' : `${saleListings!.pagination.total.toLocaleString('vi-VN')} tin đăng`}
              </p>
            </div>
            <Link
              href="/mua-ban"
              className="flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-700 transition-colors"
            >
              Xem tất cả
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {saleItems.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>

        {/* Tin thuê */}
        <div>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-text-primary">Cho thuê mới nhất</h2>
              <p className="mt-0.5 text-sm text-text-muted">
                {isRentDemo ? 'Bất động sản cho thuê nổi bật' : `${rentListings!.pagination.total.toLocaleString('vi-VN')} tin đăng`}
              </p>
            </div>
            <Link
              href="/thue"
              className="flex items-center gap-1 text-sm font-semibold text-brand hover:text-brand-700 transition-colors"
            >
              Xem tất cả
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {rentItems.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
