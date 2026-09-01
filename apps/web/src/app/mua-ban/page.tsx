import type { Metadata } from 'next';
import { fetchListings } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';

export const metadata: Metadata = {
  title: 'Nhà đất bán',
  description: 'Danh sách tin đăng bán nhà, đất, căn hộ mới nhất trên toàn quốc.',
};

interface Props {
  searchParams: { [key: string]: string | undefined };
}

export default async function MuaBanPage({ searchParams }: Props) {
  const { items, pagination } = await fetchListings({
    transactionType: 'sale',
    keyword: searchParams.keyword,
    locationSlug: searchParams.locationSlug,
    propertyType: searchParams.propertyType,
    priceMin: searchParams.priceMin,
    priceMax: searchParams.priceMax,
    page: searchParams.page ?? '1',
  }).catch(() => ({ items: [], pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 } }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Nhà đất bán {searchParams.keyword ? `— "${searchParams.keyword}"` : 'trên toàn quốc'}
      </h1>
      <p className="mt-1 text-sm text-gray-500">{pagination.total.toLocaleString('vi-VN')} tin đăng phù hợp</p>

      {items.length === 0 ? (
        <p className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
          Chưa có tin đăng nào khớp bộ lọc — dữ liệu bất động sản đang chờ khách hàng cung cấp.
        </p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
