import Link from 'next/link';
import { Listing, formatPrice } from '@/lib/api';

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  'can-ho': 'Căn hộ',
  'can_ho': 'Căn hộ',
  'can-ho-chung-cu': 'Căn hộ chung cư',
  'can_ho_chung_cu': 'Căn hộ chung cư',
  'can-ho-mini': 'Căn hộ mini',
  'can_ho_mini': 'Căn hộ mini',
  'can-ho-dich-vu': 'Căn hộ dịch vụ',
  'can_ho_dich_vu': 'Căn hộ dịch vụ',
  'can-ho-cao-cap': 'Căn hộ cao cấp',
  'can_ho_cao_cap': 'Căn hộ cao cấp',
  'studio': 'Studio',
  'can-ho-studio': 'Căn hộ Studio',
  'can_ho_studio': 'Căn hộ Studio',
  'studio-ban-cong': 'Studio ban công',
  'studio_ban_cong': 'Studio ban công',
  'studio-gac-lung': 'Studio gác lửng',
  'studio_gac_lung': 'Studio gác lửng',
  'studio-full-noi-that': 'Studio full nội thất',
  'studio_full_noi_that': 'Studio full nội thất',
  'nha-nguyen-can': 'Nhà nguyên căn',
  'nha_rieng': 'Nhà nguyên căn',
  'nha-tro': 'Nhà trọ',
  'nha_tro': 'Nhà trọ',
  'phong-tro': 'Phòng trọ',
  'phong_tro': 'Phòng trọ',
  'phong-tro-sinh-vien': 'Phòng trọ SV',
  'phong_tro_sinh_vien': 'Phòng trọ SV',
  'phong-tro-nguoi-di-lam': 'Phòng trọ đi làm',
  'ky-tuc-xa': 'Ký túc xá',
  'ky_tuc_xa': 'Ký túc xá / Sleepbox',
  'ky-tuc-xa-tu-nhan': 'Ký túc xá tư nhân',
  'van-phong': 'Văn phòng cho thuê',
  'van_phong': 'Văn phòng cho thuê',
  'kho-xuong': 'Kho xưởng cho thuê',
  'kho_xuong': 'Kho xưởng cho thuê',
  'mat-bang': 'Mặt bằng kinh doanh',
  'mat_bang': 'Mặt bằng kinh doanh',
  'mat-bang-kinh-doanh': 'Mặt bằng kinh doanh',
  'biet-thu': 'Biệt thự cho thuê',
  'biet_thu': 'Biệt thự cho thuê',
  'shophouse': 'Shophouse cho thuê',
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
  const propertyLabel = PROPERTY_TYPE_LABEL[listing.propertyType] ?? 'Bất động sản thuê';
  const timeLabel = formatTimeAgo(listing.publishedAt);
  const isSample = listing.title.startsWith('[MẪU]');
  const displayTitle = isSample ? listing.title.replace(/^\[MẪU\]\s*/, '') : listing.title;
  const nearestUni = listing.nearbyUniversities?.[0];

  return (
    <Link href={`/tin/${listing.slug}`} className="listing-card group flex flex-col justify-between">
      <div>
        {/* Ảnh: tỷ lệ 16:10 */}
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

          {/* Badge loại hình cho thuê */}
          <div className="absolute left-3 top-3">
            <span className="property-badge">
              {propertyLabel}
            </span>
          </div>


          {/* Badge Đã kiểm tra thực tế (Trust-as-a-Service) */}
          {listing.verificationStatus === 'da_xac_thuc' && (
            <div className="absolute bottom-2 left-3 z-10 flex items-center gap-1 rounded-full bg-emerald-600/95 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-sm backdrop-blur-sm border border-emerald-400/50">
              <svg className="h-3 w-3 text-white shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
              <span>Đã kiểm tra thực tế</span>
            </div>
          )}

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
          {/* Giá thuê tháng */}
          <div className="flex items-baseline gap-1.5">
            <span className="price-text">
              {formatPrice(listing.price)}
            </span>
            <span className="text-xs font-medium text-text-muted">/ tháng</span>
            {listing.areaM2 && Number(listing.areaM2) > 0 && (
              <span className="ml-auto text-xs text-text-muted shrink-0 font-medium">
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
            {listing.verificationStatus === 'da_xac_thuc' && (
              <span className="mr-1.5 inline-flex items-center gap-0.5 rounded bg-emerald-50 border border-emerald-200/90 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 align-middle">
                <span className="text-emerald-600">✓</span> Xác thực
              </span>
            )}
            {displayTitle}
          </p>

          {/* Badge khoảng cách tìm kiếm theo địa chỉ nếu có */}
          {listing.distanceText ? (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/70">
              <span>📍</span>
              <span>{listing.distanceText}</span>
            </div>
          ) : listing.distanceMeters != null ? (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200/70">
              <span>📍</span>
              <span>
                {listing.distanceMeters < 1000
                  ? `Cách địa chỉ ~${listing.distanceMeters}m`
                  : `Cách địa chỉ ~${(listing.distanceMeters / 1000).toFixed(1)} km`}
              </span>
            </div>
          ) : nearestUni ? (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-brand font-medium truncate">
              <span>🎓</span>
              <span className="truncate">
                Gần {nearestUni.university.abbreviation || nearestUni.university.name}
                {nearestUni.distanceMeters ? ` (~${nearestUni.distanceMeters}m)` : ''}
              </span>
            </div>
          ) : null}

          {/* Địa chỉ */}
          <p className="mt-1.5 flex items-center gap-1 text-xs text-text-muted">
            <svg className="h-3 w-3 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="truncate">{listing.addressDetail ?? listing.location.name}</span>
          </p>
        </div>
      </div>

      {/* Thông tin nhanh + thời gian */}
      <div className="px-4 pb-3 pt-0">
        <div className="flex items-center justify-between border-t border-surface-border pt-2 text-xs text-text-muted">
          <div className="flex items-center gap-3">
            {listing.depositAmount ? (
              <span className="text-[11px] text-teal-700 font-medium">
                Cọc: {formatPrice(listing.depositAmount)}
              </span>
            ) : listing.bedrooms != null ? (
              <span>{listing.bedrooms} PN</span>
            ) : null}
            {listing.minLeaseMonths ? (
              <span className="text-[11px] text-text-muted">
                HĐ: {listing.minLeaseMonths}T+
              </span>
            ) : null}
          </div>
          {timeLabel && (
            <span className="text-xs text-text-muted">{timeLabel}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
