import Link from 'next/link';
import { fetchListings } from '@/lib/api';
import { ListingCard } from '@/components/ListingCard';

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof fetchListings>> | null = null;
  let errorMessage: string | null = null;

  try {
    featured = await fetchListings({ pageSize: '8' });
  } catch {
    errorMessage = 'Chưa kết nối được tới API (kiểm tra apps/api đã chạy và có dữ liệu chưa).';
  }

  return (
    <div>
      {/* Hero + thanh tìm kiếm */}
      <section className="bg-gradient-to-b from-brand/20 to-transparent py-14">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
            Tìm nhà đất nhanh — An tâm chọn, an tâm mua
          </h1>
          <p className="mt-3 text-gray-600">
            Tìm kiếm hàng nghìn tin đăng mua bán, cho thuê nhà đất, căn hộ trên toàn quốc.
          </p>

          <form action="/mua-ban" className="mx-auto mt-8 flex max-w-2xl overflow-hidden rounded-full bg-white shadow-lg">
            <input
              name="keyword"
              placeholder="Nhập khu vực, dự án, tên đường..."
              className="flex-1 px-6 py-4 text-sm outline-none"
            />
            <button type="submit" className="bg-brand px-8 font-semibold text-gray-900 hover:bg-brand-dark">
              Tìm kiếm
            </button>
          </form>

          <div className="mt-4 flex justify-center gap-4 text-sm">
            <Link href="/mua-ban" className="text-brand-dark hover:underline">Nhà đất bán</Link>
            <Link href="/thue" className="text-brand-dark hover:underline">Nhà đất cho thuê</Link>
            <Link href="/du-an" className="text-brand-dark hover:underline">Dự án</Link>
            <Link href="/gia-nha-dat" className="text-brand-dark hover:underline">Giá nhà đất</Link>
          </div>
        </div>
      </section>

      {/* Tin nổi bật */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Tin đăng mới nhất</h2>

        {errorMessage && (
          <p className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">{errorMessage}</p>
        )}

        {featured && featured.items.length === 0 && (
          <p className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800">
            Chưa có tin đăng nào trong hệ thống. Dữ liệu bất động sản sẽ được cập nhật khi khách hàng
            cung cấp — xem <code>packages/database/scripts/import-listings.ts</code> để nạp dữ liệu hàng loạt.
          </p>
        )}

        {featured && featured.items.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.items.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
