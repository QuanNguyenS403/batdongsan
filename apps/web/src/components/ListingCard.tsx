import Link from 'next/link';
import { Listing, formatPrice } from '@/lib/api';

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  'can-ho': 'Căn hộ',
  'nha-nguyen-can': 'Nhà riêng',
  'dat': 'Đất nền',
  'shophouse': 'Shophouse',
  'phong-tro': 'Phòng trọ',
  'van-phong': 'Văn phòng',
  'kho-xuong': 'Kho xưởng',
  'biet-thu': 'Biệt thự',
  'nha-mat-pho': 'Nhà mặt phố',
};

function formatTimeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return 'Hôm nay';
  if (days === 1) return 'Hôm qua';
  if (days < 7) return `${days} ngày trước`;
  if (days < 30) return `${Math.floor(days / 7)} tuần trước`;
  return `${Math.floor(days / 30)} tháng trước`;
}

export function ListingCard({ listing }: { listing: Listing }) {
  const cover = listing.images[0]?.imageUrl;
  const propertyLabel = PROPERTY_TYPE_LABEL[listing.propertyType] ?? 'Bất động sản';
  const timeLabel = formatTimeAgo(listing.publishedAt);
  const isSample = listing.title.startsWith('[MẪU]');
  const displayTitle = isSample ? listing.title.replace(/^\[MẪU\]\s*/, '') : listing.title;

  return (
    <Link href={`/tin/${listing.slug}`} className="listing-card group">
      {/* Ảnh: tỷ lệ 16:10 (ngang hơn 4:3 mặc định, giống card BĐS hiện đại) */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={displayTitle}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            style={{ willChange: 'transform', transform: 'translateZ(0)' }}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M4.5 3v18m15-18v18" />
            </svg>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* Badge loại BĐS */}
        <div className="absolute left-3 top-3">
          <span className="property-badge">
            {propertyLabel}
          </span>
        </div>

        {/* Badge giao dịch */}
        <div className="absolute right-3 top-3">
          {listing.transactionType === 'sale' ? (
            <span className="transaction-badge-sale">Bán</span>
          ) : (
            <span className="transaction-badge-rent">Thuê</span>
          )}
        </div>

        {/* Số lượng ảnh */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-xs text-white backdrop-blur-sm">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M3.75 3h16.5M4.5 3v18m15-18v18" />
            </svg>
            {listing.images.length}
          </div>
        )}
      </div>

      {/* Nội dung card */}
      <div className="p-4">
        {/* Giá — nổi bật nhất */}
        <div className="flex items-baseline gap-1.5">
          <span className="price-text">
            {formatPrice(listing.price)}
          </span>
          {listing.transactionType === 'rent' && (
            <span className="text-xs text-text-muted">/tháng</span>
          )}
          {listing.areaM2 && Number(listing.areaM2) > 0 && (
            <span className="ml-auto text-xs text-text-muted shrink-0">
              {listing.areaM2} m²
            </span>
          )}
        </div>

        {/* Tiêu đề */}
        <p className="mt-1.5 line-clamp-2 text-sm font-semibold text-text-primary leading-snug group-hover:text-brand transition-colors">
          {isSample && (
            <span className="mr-1.5 inline-flex items-center rounded bg-amber-50 border border-amber-200/70 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 align-middle">
              Tin tham khảo
            </span>
          )}
          {displayTitle}
        </p>

        {/* Địa chỉ */}
        <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
          <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <span className="truncate">{listing.addressDetail ?? listing.location.name}</span>
        </p>

        {/* Thông tin nhanh + thời gian */}
        <div className="mt-2.5 flex items-center justify-between border-t border-surface-border pt-2.5">
          <div className="flex items-center gap-3 text-xs text-text-muted">
            {listing.bedrooms != null && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                {listing.bedrooms} PN
              </span>
            )}
            {listing.bathrooms != null && (
              <span className="flex items-center gap-1">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
                </svg>
                {listing.bathrooms} WC
              </span>
            )}
          </div>
          {timeLabel && (
            <span className="text-xs text-text-muted">{timeLabel}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
