import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchListings } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';
import { Pagination } from '@/components/Pagination';
import { SearchFilterBar } from '@/components/SearchFilterBar';

export const metadata: Metadata = {
  title: 'Cho thuê nhà đất',
  description: 'Danh sách tin cho thuê nhà, căn hộ, phòng trọ mới nhất trên toàn quốc. Lọc theo giá, diện tích, khu vực.',
};

interface Props {
  searchParams: { [key: string]: string | undefined };
}

export default async function ThuePage({ searchParams }: Props) {
  const { items, pagination } = await fetchListings({
    transactionType: 'rent',
    keyword: searchParams.keyword,
    locationSlug: searchParams.locationSlug,
    propertyType: searchParams.propertyType,
    priceMin: searchParams.priceMin,
    priceMax: searchParams.priceMax,
    areaMin: searchParams.areaMin,
    areaMax: searchParams.areaMax,
    page: searchParams.page ?? '1',
  }).catch(() => ({ items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }));

  const month = new Date().toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="container-max py-8">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-xs text-text-muted">
          <Link href="/" className="hover:text-brand transition-colors">Trang chủ</Link>
          <span>›</span>
          <span className="text-text-secondary font-medium">Cho thuê nhà đất</span>
        </nav>

        <h1 className="text-2xl font-bold text-text-primary md:text-3xl">
          Cho thuê nhà đất{searchParams.keyword ? ` — "${searchParams.keyword}"` : ''} mới nhất {month}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {pagination.total.toLocaleString('vi-VN')} tin đăng phù hợp
        </p>

        <div className="mt-5">
          <SearchFilterBar basePath="/thue" transactionType="rent" initialParams={searchParams} />
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-surface-border bg-white p-10 text-center">
            <span className="text-4xl">🔍</span>
            <p className="mt-3 font-semibold text-text-primary">Không tìm thấy tin đăng phù hợp</p>
            <p className="mt-1 text-sm text-text-secondary">
              Thử bỏ bộ lọc hoặc tìm kiếm với từ khoá khác.
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
