import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchListings } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { Pagination } from '@/components/Pagination';
import { SearchFilterBar } from '@/components/SearchFilterBar';
import { DEMO_ROOM_RENT_LISTINGS } from '@/lib/demo-data';

export const metadata: Metadata = {
  title: 'Cho thuê phòng trọ, nhà trọ sinh viên & người đi làm',
  description:
    'Kênh tìm kiếm phòng trọ, nhà trọ giá rẻ, ký túc xá, căn hộ mini khép kín chính chủ, an ninh tốt, giờ giấc tự do trên toàn quốc. Cập nhật liên tục.',
};

const PROPERTY_TYPES_ROOM = [
  { value: '', label: 'Tất cả loại phòng trọ' },
  { value: 'phong_tro', label: 'Phòng trọ khép kín' },
  { value: 'ky_tuc_xa', label: 'Ký túc xá / Sleepbox' },
  { value: 'can_ho_mini', label: 'Căn hộ mini / Studio' },
  { value: 'nha_tro', label: 'Nhà trọ nguyên căn' },
];

const PRICE_PRESETS_ROOM = [
  { label: 'Tất cả mức giá', min: '', max: '' },
  { label: 'Dưới 2 triệu', min: '', max: '2000000' },
  { label: '2 - 3 triệu', min: '2000000', max: '3000000' },
  { label: '3 - 5 triệu', min: '3000000', max: '5000000' },
  { label: '5 - 8 triệu', min: '5000000', max: '8000000' },
  { label: 'Trên 8 triệu', min: '8000000', max: '' },
];

const AREA_PRESETS_ROOM = [
  { label: 'Tất cả diện tích', min: '', max: '' },
  { label: 'Dưới 20 m²', min: '', max: '20' },
  { label: '20 - 30 m²', min: '20', max: '30' },
  { label: '30 - 45 m²', min: '30', max: '45' },
  { label: 'Trên 45 m²', min: '45', max: '' },
];

interface Props {
  searchParams: { [key: string]: string | undefined };
}

export default async function ChoThueTroPage({ searchParams }: Props) {
  const { items, pagination } = await fetchListings({
    transactionType: 'rent',
    categoryGroup: 'thue_tro',
    keyword: searchParams.keyword,
    locationSlug: searchParams.locationSlug,
    propertyType: searchParams.propertyType,
    priceMin: searchParams.priceMin,
    priceMax: searchParams.priceMax,
    areaMin: searchParams.areaMin,
    areaMax: searchParams.areaMax,
    page: searchParams.page ?? '1',
  }).catch(() => ({
    items: DEMO_ROOM_RENT_LISTINGS,
    pagination: { page: 1, pageSize: 20, total: DEMO_ROOM_RENT_LISTINGS.length, totalPages: 1 },
  }));

  const month = new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="container-max py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-text-muted">
          <Link href="/" className="hover:text-brand transition-colors">Trang chủ</Link>
          <span>›</span>
          <span className="text-text-secondary font-medium">Cho thuê trọ</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 text-xs font-semibold mb-2">
              <span>🛏️</span>
              <span>Chuyên mục Cho thuê phòng trọ & Nhà trọ</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
              Cho thuê phòng trọ, nhà trọ{searchParams.keyword ? ` — "${searchParams.keyword}"` : ''} mới nhất {month}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {pagination.total.toLocaleString('vi-VN')} phòng trọ, căn hộ mini chính chủ đang cho thuê
            </p>
          </div>
        </div>

        <div className="mt-5">
          <SearchFilterBar
            basePath="/cho-thue-tro"
            transactionType="rent"
            propertyTypes={PROPERTY_TYPES_ROOM}
            customPricePresets={PRICE_PRESETS_ROOM}
            customAreaPresets={AREA_PRESETS_ROOM}
            placeholder="Tìm theo khu vực, trường ĐH, tuyến đường..."
            initialParams={searchParams}
          />
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-surface-border bg-white p-10 text-center">
            <span className="text-4xl">🛏️</span>
            <p className="mt-3 font-semibold text-text-primary">Không tìm thấy phòng trọ phù hợp</p>
            <p className="mt-1 text-sm text-text-secondary">
              Thử bỏ bộ lọc hoặc mở rộng khoảng giá/diện tích để tìm được phòng trọ ưng ý.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-2 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.totalPages}
              basePath="/cho-thue-tro"
              searchParams={searchParams}
            />
          </>
        )}
      </div>
    </div>
  );
}
