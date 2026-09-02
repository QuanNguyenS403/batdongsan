import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchListingBySlug, formatPrice } from '@/lib/api';
import { ALL_DEMO_LISTINGS } from '@/lib/demo-data';
import { RevealPhoneButton } from './RevealPhoneButton';
import { SaveListingButton } from './SaveListingButton';
import { LoanCalculatorWidget } from '@/components/LoanCalculatorWidget';
import { ReportListingModal } from '@/components/ReportListingModal';

interface Props {
  params: { slug: string };
}

async function getListingOrNotFound(slug: string) {
  try {
    return await fetchListingBySlug(slug);
  } catch {
    const demo = ALL_DEMO_LISTINGS.find((item) => item.slug === slug);
    if (demo) return demo;
    notFound();
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const listing = await getListingOrNotFound(params.slug);
    const desc = listing.description?.slice(0, 160) ?? `${listing.title} tại ${listing.location.name}`;
    return {
      title: `${listing.title} | BatDongSan.vn`,
      description: desc,
      openGraph: {
        title: listing.title,
        description: desc,
        images: listing.images[0] ? [listing.images[0].imageUrl] : [],
      },
    };
  } catch {
    return {
      title: 'Chi tiết bất động sản | BatDongSan.vn',
      description: 'Thông tin chi tiết tin đăng mua bán, cho thuê bất động sản.',
    };
  }
}

// Map đầy đủ nhãn tiếng Việt, fallback an toàn thay vì lộ slug thô
const LEGAL_STATUS_LABEL: Record<string, string> = {
  so_do: 'Sổ đỏ',
  so_hong: 'Sổ hồng',
  hop_dong: 'Hợp đồng mua bán',
  dang_cho_so: 'Đang chờ sổ',
};

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  'can-ho': 'Căn hộ / Chung cư',
  'nha-nguyen-can': 'Nhà riêng / Nhà phố',
  'dat': 'Đất nền',
  'shophouse': 'Shophouse',
  'phong-tro': 'Phòng trọ',
  'van-phong': 'Văn phòng',
  'kho-xuong': 'Kho xưởng',
  'biet-thu': 'Biệt thự',
  'nha-mat-pho': 'Nhà mặt phố',
};

export default async function ListingDetailPage({ params }: Props) {
  const listing = await getListingOrNotFound(params.slug);
  const isSale = listing.transactionType === 'sale';
  const transactionLabel = isSale ? 'Mua bán' : 'Cho thuê';
  const transactionPath = isSale ? '/mua-ban' : '/thue';
  const isSample = listing.title.startsWith('[MẪU]');
  const displayTitle = isSample ? listing.title.replace(/^\[MẪU\]\s*/, '') : listing.title;

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="container-max py-6">
        {/* Breadcrumb 4 cấp — #39 */}
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
          <Link href="/" className="hover:text-brand transition-colors">Trang chủ</Link>
          <span>›</span>
          <Link href={transactionPath} className="hover:text-brand transition-colors">{transactionLabel}</Link>
          <span>›</span>
          <Link
            href={`${transactionPath}?locationSlug=${listing.location.slug}`}
            className="hover:text-brand transition-colors"
          >
            {listing.location.name}
          </Link>
          <span>›</span>
          <span className="text-text-secondary font-medium line-clamp-1 max-w-xs">{displayTitle}</span>
        </nav>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cột trái — nội dung chính */}
          <div className="lg:col-span-2 space-y-5">
            {/* Gallery */}
            <div className="overflow-hidden rounded-2xl bg-slate-100">
              <div className="aspect-video w-full">
                {listing.images[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={listing.images[0].imageUrl}
                    alt={displayTitle}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <svg className="h-16 w-16 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M4.5 3v18m15-18v18" />
                    </svg>
                  </div>
                )}
              </div>
              {listing.images.length > 1 && (
                <div className="grid grid-cols-5 gap-1.5 p-1.5">
                  {listing.images.slice(1, 6).map((img) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={img.imageUrl}
                      src={img.imageUrl}
                      alt=""
                      className="aspect-square rounded-lg object-cover"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Tiêu đề + giá */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`property-badge ${isSale ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                      {isSale ? 'Bán' : 'Cho thuê'}
                    </span>
                    <span className="property-badge">
                      {PROPERTY_TYPE_LABEL[listing.propertyType] ?? 'Bất động sản'}
                    </span>
                    {isSample && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        Tin tham khảo
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl font-bold text-text-primary md:text-2xl">{displayTitle}</h1>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text-muted">
                    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {listing.addressDetail ?? listing.location.name}
                  </p>
                  <p className="mt-3 text-3xl font-bold text-brand">
                    {formatPrice(listing.price)}
                    {!isSale && <span className="text-base font-normal text-text-muted"> / tháng</span>}
                  </p>
                </div>
                <SaveListingButton listingId={listing.id} />
              </div>
            </div>

            {/* Thông tin chính */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
              <h2 className="mb-4 font-semibold text-text-primary">Thông tin bất động sản</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <InfoRow label="Diện tích" value={`${listing.areaM2} m²`} />
                {listing.bedrooms != null && <InfoRow label="Phòng ngủ" value={`${listing.bedrooms} phòng`} />}
                {listing.bathrooms != null && <InfoRow label="Phòng tắm" value={`${listing.bathrooms} phòng`} />}
                {listing.legalStatus && (
                  // #36: fallback "Không xác định" thay vì lộ slug thô
                  <InfoRow
                    label="Pháp lý"
                    value={LEGAL_STATUS_LABEL[listing.legalStatus] ?? 'Không xác định'}
                  />
                )}
                <InfoRow
                  label="Ngày đăng"
                  value={listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString('vi-VN') : '—'}
                />
                <InfoRow label="Mã BĐS" value={`#${listing.id}`} mono />
              </div>
            </div>

            {/* Mô tả */}
            {listing.description && (
              <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
                <h2 className="mb-3 font-semibold text-text-primary">Mô tả chi tiết</h2>
                <div className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                  {listing.description}
                </div>
              </div>
            )}

            {/* Công cụ tính vay */}
            {isSale && (
              <div id="loan-calculator">
                <LoanCalculatorWidget initialPrice={listing.price} />
              </div>
            )}

            {/* Báo vi phạm */}
            <ReportListingModal listingId={listing.id} />
          </div>

          {/* Cột phải — sidebar liên hệ */}
          <aside>
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
                <h3 className="mb-4 text-sm font-semibold text-text-muted uppercase tracking-wide">
                  Thông tin người đăng
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
                    {(listing.owner.fullName ?? 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{listing.owner.fullName ?? 'Người đăng tin'}</p>
                    <p className="text-xs text-text-muted">
                      Đã tham gia{' '}
                      {Math.max(1, Math.floor((Date.now() - new Date(listing.owner.createdAt).getTime()) / 86_400_000))}{' '}
                      ngày
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  <RevealPhoneButton listingId={listing.id} />
                  <button className="btn-secondary w-full">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                    </svg>
                    Gửi tin nhắn
                  </button>
                </div>
              </div>

              {/* Card vay ngân hàng nếu là tin bán */}
              {isSale && (
                <div className="rounded-2xl bg-gradient-to-br from-brand/5 to-brand/10 border border-brand/20 p-4">
                  <p className="text-sm font-semibold text-brand">🏦 Hỗ trợ vay mua nhà</p>
                  <p className="mt-1 text-xs text-text-secondary">Tính toán khoản vay phù hợp với tài chính của bạn.</p>
                  <a
                    href="#loan-calculator"
                    className="mt-3 inline-block text-xs font-semibold text-brand hover:text-brand-700 transition-colors"
                  >
                    Xem công cụ tính vay ↓
                  </a>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-text-muted">{label}</p>
      <p className={`text-sm font-semibold text-text-primary ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  );
}
