import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchListings } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { Pagination } from '@/components/Pagination';
import { SearchFilterBar } from '@/components/SearchFilterBar';
import { DEMO_SPACE_RENT_LISTINGS } from '@/lib/demo-data';

export const metadata: Metadata = {
  title: 'Cho thuê mặt bằng kinh doanh, cửa hàng, shophouse',
  description:
    'Kênh tìm kiếm mặt bằng kinh doanh, nhà mặt phố buôn bán, shophouse khối đế, kho xưởng, ki-ốt vị trí đẹp, tiềm năng thương mại cao chính chủ trên toàn quốc.',
};

const PROPERTY_TYPES_SPACE = [
  { value: '', label: 'Tất cả loại mặt bằng' },
  { value: 'mat_bang', label: 'Mặt bằng kinh doanh / Mặt phố' },
  { value: 'cua_hang', label: 'Cửa hàng / Ki-ốt' },
  { value: 'shophouse', label: 'Shophouse khối đế' },
  { value: 'kho_xuong', label: 'Kho xưởng / Bãi đất' },
  { value: 'van_phong', label: 'Văn phòng kinh doanh' },
];

const PRICE_PRESETS_SPACE = [
  { label: 'Tất cả mức giá', min: '', max: '' },
  { label: 'Dưới 10 triệu', min: '', max: '10000000' },
  { label: '10 - 20 triệu', min: '10000000', max: '20000000' },
  { label: '20 - 50 triệu', min: '20000000', max: '50000000' },
  { label: '50 - 100 triệu', min: '50000000', max: '100000000' },
  { label: 'Trên 100 triệu', min: '100000000', max: '' },
];

const AREA_PRESETS_SPACE = [
  { label: 'Tất cả diện tích', min: '', max: '' },
  { label: 'Dưới 50 m²', min: '', max: '50' },
  { label: '50 - 100 m²', min: '50', max: '100' },
  { label: '100 - 200 m²', min: '100', max: '200' },
  { label: '200 - 500 m²', min: '200', max: '500' },
  { label: 'Trên 500 m²', min: '500', max: '' },
];

interface Props {
  searchParams: { [key: string]: string | undefined };
}

export default async function ChoThueMatBangPage({ searchParams }: Props) {
  const isProduction = process.env.NODE_ENV === 'production';
  let isApiError = false;

  const { items, pagination } = await fetchListings({
    transactionType: 'rent',
    categoryGroup: 'thue_mat_bang',
    keyword: searchParams.keyword,
    locationSlug: searchParams.locationSlug,
    universitySlug: searchParams.universitySlug,
    utilitiesIncluded: searchParams.utilitiesIncluded,
    propertyType: searchParams.propertyType,
    priceMin: searchParams.priceMin,
    priceMax: searchParams.priceMax,
    areaMin: searchParams.areaMin,
    areaMax: searchParams.areaMax,
    page: searchParams.page ?? '1',
  }).catch(() => {
    isApiError = true;
    return {
      items: isProduction ? [] : DEMO_SPACE_RENT_LISTINGS,
      pagination: {
        page: 1,
        pageSize: 20,
        total: isProduction ? 0 : DEMO_SPACE_RENT_LISTINGS.length,
        totalPages: isProduction ? 0 : 1,
      },
    };
  });

  const month = new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="container-max py-8">
        {isApiError && isProduction && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            ⚠️ Đang có gián đoạn kết nối tới máy chủ dữ liệu. Danh sách mặt bằng tạm thời chưa tải được.
          </div>
        )}
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-text-muted">
          <Link href="/" className="hover:text-brand transition-colors">Trang chủ</Link>
          <span>›</span>
          <span className="text-text-secondary font-medium">Cho thuê mặt bằng</span>
        </nav>

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-700 text-xs font-semibold mb-2">
              <span>🏪</span>
              <span>Chuyên mục Mặt bằng kinh doanh & Cửa hàng</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
              Cho thuê mặt bằng kinh doanh{searchParams.keyword ? ` — "${searchParams.keyword}"` : ''} mới nhất {month}
            </h1>
            <p className="mt-1 text-sm text-text-muted">
              {pagination.total.toLocaleString('vi-VN')} mặt bằng, cửa hàng, shophouse vị trí đẹp đang cho thuê
            </p>
          </div>
        </div>

        <div className="mt-5">
          <SearchFilterBar
            basePath="/cho-thue-mat-bang"
            transactionType="rent"
            propertyTypes={PROPERTY_TYPES_SPACE}
            customPricePresets={PRICE_PRESETS_SPACE}
            customAreaPresets={AREA_PRESETS_SPACE}
            placeholder="Tìm theo tuyến phố, khu thương mại, quận/huyện..."
            initialParams={searchParams}
          />
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-surface-border bg-white p-10 text-center">
            <span className="text-4xl">🏪</span>
            <p className="mt-3 font-semibold text-text-primary">Không tìm thấy mặt bằng phù hợp</p>
            <p className="mt-1 text-sm text-text-secondary">
              Thử điều chỉnh bộ lọc hoặc tìm kiếm theo khu vực/tuyến phố khác.
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
              basePath="/cho-thue-mat-bang"
              searchParams={searchParams}
            />
          </>
        )}
      </div>
    </div>
  );
}
