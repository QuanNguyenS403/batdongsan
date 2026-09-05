import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchListings } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { Pagination } from '@/components/Pagination';
import { SearchFilterBar } from '@/components/SearchFilterBar';
import { DEMO_RENT_LISTINGS } from '@/lib/demo-data';

export const metadata: Metadata = {
  title: 'Cho thuê BĐS — Phòng trọ, Căn hộ, Studio & Nhà nguyên căn',
  description:
    'Danh sách tin cho thuê phòng trọ sinh viên, căn hộ chung cư, studio và nhà nguyên căn chính chủ mới nhất. Lọc theo trường đại học, giá thuê tháng, tiện ích bao điện nước.',
};

const PROPERTY_TYPES_RENT = [
  { value: '', label: 'Tất cả loại BĐS thuê' },
  { value: 'phong_tro', label: 'Phòng trọ sinh viên' },
  { value: 'ky_tuc_xa', label: 'Ký túc xá / Sleepbox' },
  { value: 'can_ho_mini', label: 'Căn hộ mini / Studio' },
  { value: 'can_ho', label: 'Căn hộ chung cư' },
  { value: 'nha_rieng', label: 'Nhà riêng / Nhà phố' },
  { value: 'mat_bang', label: 'Mặt bằng kinh doanh' },
];

interface Props {
  searchParams: { [key: string]: string | undefined };
}

export default async function ThuePage({ searchParams }: Props) {
  const { items, pagination } = await fetchListings({
    transactionType: 'rent',
    categoryGroup: searchParams.categoryGroup,
    keyword: searchParams.keyword,
    locationSlug: searchParams.locationSlug,
    universitySlug: searchParams.universitySlug,
    propertyType: searchParams.propertyType,
    priceMin: searchParams.priceMin,
    priceMax: searchParams.priceMax,
    areaMin: searchParams.areaMin,
    areaMax: searchParams.areaMax,
    page: searchParams.page ?? '1',
  }).catch(() => ({
    items: DEMO_RENT_LISTINGS,
    pagination: { page: 1, pageSize: 20, total: DEMO_RENT_LISTINGS.length, totalPages: 1 },
  }));

  const month = new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
  const filterSummary = searchParams.keyword
    ? ` — "${searchParams.keyword}"`
    : searchParams.universitySlug
      ? ` — Khu vực ${searchParams.universitySlug}`
      : '';

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="container-max py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-text-muted">
          <Link href="/" className="hover:text-brand transition-colors">Trang chủ</Link>
          <span>›</span>
          <span className="text-text-secondary font-medium">Bất động sản cho thuê</span>
        </nav>

        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
          Cho thuê BĐS{filterSummary} mới nhất {month}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {pagination.total.toLocaleString('vi-VN')} tin cho thuê phù hợp
        </p>

        <div className="mt-5">
          <SearchFilterBar
            basePath="/thue"
            propertyTypes={PROPERTY_TYPES_RENT}
            initialParams={searchParams}
          />
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-surface-border bg-white p-10 text-center">
            <span className="text-4xl">🔍</span>
            <p className="mt-3 font-semibold text-text-primary">Không tìm thấy tin cho thuê phù hợp</p>
            <p className="mt-1 text-sm text-text-secondary">
              Thử điều chỉnh bộ lọc giá, trường đại học hoặc tìm kiếm với từ khoá khác.
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
              basePath="/thue"
              searchParams={searchParams}
            />
          </>
        )}
      </div>
    </div>
  );
}
