import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchListingBySlug, formatPrice } from '@/lib/api';
import { RevealPhoneButton } from './RevealPhoneButton';

interface Props {
  params: { slug: string };
}

async function getListingOrNotFound(slug: string) {
  try {
    return await fetchListingBySlug(slug);
  } catch (err) {
    if ((err as Error).message === 'NOT_FOUND') notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const listing = await getListingOrNotFound(params.slug);
  return {
    title: listing.title,
    description: listing.description?.slice(0, 160) ?? `${listing.title} tại ${listing.location.name}`,
    openGraph: {
      title: listing.title,
      images: listing.images[0] ? [listing.images[0].imageUrl] : [],
    },
  };
}

const LEGAL_STATUS_LABEL: Record<string, string> = {
  so_do: 'Sổ đỏ',
  so_hong: 'Sổ hồng',
  hop_dong: 'Hợp đồng mua bán',
  dang_cho_so: 'Đang chờ sổ',
};

export default async function ListingDetailPage({ params }: Props) {
  const listing = await getListingOrNotFound(params.slug);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-500">
        Trang chủ &rsaquo; {listing.transactionType === 'sale' ? 'Nhà đất bán' : 'Nhà đất cho thuê'} &rsaquo;{' '}
        {listing.location.name}
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {/* Gallery */}
          <div className="aspect-video w-full overflow-hidden rounded-xl bg-gray-100">
            {listing.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={listing.images[0].imageUrl} alt={listing.title} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">Chưa có ảnh</div>
            )}
          </div>
          {listing.images.length > 1 && (
            <div className="mt-2 grid grid-cols-5 gap-2">
              {listing.images.slice(1, 6).map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.imageUrl} src={img.imageUrl} alt="" className="aspect-square rounded object-cover" />
              ))}
            </div>
          )}

          <h1 className="mt-6 text-2xl font-bold text-gray-900">{listing.title}</h1>
          <p className="mt-1 text-gray-500">{listing.addressDetail ?? listing.location.name}</p>
          <p className="mt-3 text-3xl font-bold text-brand-dark">{formatPrice(listing.price)}</p>

          {/* Thông tin chính */}
          <div className="mt-6 grid grid-cols-2 gap-4 rounded-xl border bg-white p-5 sm:grid-cols-3">
            <Info label="Diện tích" value={`${listing.areaM2} m²`} />
            {listing.bedrooms != null && <Info label="Phòng ngủ" value={`${listing.bedrooms}`} />}
            {listing.bathrooms != null && <Info label="Phòng tắm" value={`${listing.bathrooms}`} />}
            {listing.legalStatus && (
              <Info label="Pháp lý" value={LEGAL_STATUS_LABEL[listing.legalStatus] ?? listing.legalStatus} />
            )}
            <Info label="Ngày đăng" value={listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString('vi-VN') : '—'} />
            <Info label="Mã BĐS" value={listing.id} />
          </div>

          {/* Mô tả */}
          {listing.description && (
            <div className="mt-6 whitespace-pre-line rounded-xl border bg-white p-5 text-gray-700">
              {listing.description}
            </div>
          )}

          <ReportForm listingId={listing.id} />
        </div>

        {/* Sidebar liên hệ */}
        <aside>
          <div className="sticky top-20 rounded-xl border bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gray-200" />
              <div>
                <p className="font-semibold text-gray-900">{listing.owner.fullName ?? 'Người đăng tin'}</p>
                <p className="text-xs text-gray-500">
                  Đã tham gia{' '}
                  {Math.max(1, Math.floor((Date.now() - new Date(listing.owner.createdAt).getTime()) / 86_400_000))}{' '}
                  ngày
                </p>
              </div>
            </div>

            <RevealPhoneButton listingId={listing.id} />

            <button className="mt-2 w-full rounded-full border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Gửi tin nhắn
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  );
}

function ReportForm({ listingId }: { listingId: string }) {
  return (
    <details className="mt-4 text-sm text-gray-500">
      <summary className="cursor-pointer hover:text-red-600">🚩 Báo cáo tin vi phạm</summary>
      <p className="mt-2">
        Chức năng báo cáo gọi tới <code>POST /listings/{listingId}/report</code> — cần nối form thật ở bản hoàn thiện.
      </p>
    </details>
  );
}
