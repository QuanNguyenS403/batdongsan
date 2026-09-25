import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchListingBySlug, fetchListings, formatPrice, formatExactPrice } from '@/lib/api';
import { ALL_DEMO_LISTINGS } from '@/lib/demo-data';
import { PropertyGallery } from './PropertyGallery';
import { ReportListingModal } from '@/components/ReportListingModal';
import { OwnerContactBox } from './OwnerContactBox';
import { MobileStickyContactBar } from './MobileStickyContactBar';
import { MoveInCostEstimator } from '@/components/MoveInCostEstimator';
import {
  getNearbyUniversities,
  getGoogleMapsEmbedUrl,
  getGoogleMapsViewUrl,
  getGoogleMapsDirectionsUrl,
} from '@/lib/vietnam-universities';

interface Props {
  params: { slug: string };
}

// React cache() tự động deduplicate request giữa generateMetadata và ListingDetailPage
const getListingOrNotFound = cache(async (slug: string) => {
  try {
    return await fetchListingBySlug(slug);
  } catch (err: any) {
    // FE-N04: Tuyệt đối không fallback demo data trên production
    if (process.env.NODE_ENV !== 'production') {
      const demo = ALL_DEMO_LISTINGS.find((item) => item.slug === slug);
      if (demo) return demo;
    }
    notFound();
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const listing = await getListingOrNotFound(params.slug);
    const desc = listing.description?.slice(0, 160) ?? `${listing.title} tại ${listing.location.name}`;
    return {
      title: `${listing.title} | QNS BROKER`,
      description: desc,
      openGraph: {
        title: listing.title,
        description: desc,
        images: listing.images[0] ? [listing.images[0].imageUrl] : [],
      },
    };
  } catch {
    return {
      title: 'Chi tiết phòng cho thuê | QNS BROKER',
      description: 'Thông tin chi tiết phòng trọ, căn hộ, studio cho thuê minh bạch chi phí, chuyên viên Đức Quân trực tiếp tư vấn và dẫn xem miễn phí',
    };
  }
}

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  'phong-tro-sinh-vien': 'Phòng trọ sinh viên',
  'phong_tro_sinh_vien': 'Phòng trọ sinh viên',
  'phong-tro-nguoi-di-lam': 'Phòng trọ người đi làm',
  'phong_tro_nguoi_di_lam': 'Phòng trọ người đi làm',
  'phong-tro': 'Phòng trọ',
  'phong_tro': 'Phòng trọ',
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
  'nha_nguyen_can': 'Nhà nguyên căn',
  'nha_rieng': 'Nhà nguyên căn',
  'ky-tuc-xa-tu-nhan': 'Ký túc xá tư nhân / Sleepbox',
  'ky_tuc_xa_tu_nhan': 'Ký túc xá tư nhân / Sleepbox',
  'mat-bang-kinh-doanh': 'Mặt bằng kinh doanh',
  'mat_bang_kinh_doanh': 'Mặt bằng kinh doanh',
  'mat-bang': 'Mặt bằng kinh doanh',
  'mat_bang': 'Mặt bằng kinh doanh',
};

const LEGAL_STATUS_LABEL: Record<string, string> = {
  hop_dong_6_thang: 'Hợp đồng 6 tháng',
  hop_dong_1_nam: 'Hợp đồng 1 năm',
  hop_dong_dai_han: 'Hợp đồng dài hạn',
  so_hong: 'Sổ hồng / Sổ đỏ',
  so_do: 'Sổ đỏ',
  giay_to_hop_le: 'Giấy tờ hợp lệ',
};

function formatJoinedDuration(createdAt: string): string {
  const diffDays = Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000));
  if (diffDays < 30) return `${diffDays} ngày`;
  const months = Math.floor(diffDays / 30);
  if (months < 12) return `${months} tháng`;
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  return remMonths > 0 ? `${years} năm ${remMonths} tháng` : `${years} năm`;
}

export default async function ListingDetailPage({ params }: Props) {
  const listing = await getListingOrNotFound(params.slug);

  const isSample = listing.title.startsWith('[MẪU]');
  const displayTitle = isSample ? listing.title.replace(/^\[MẪU\]\s*/, '') : listing.title;
  const cleanOwnerName = (listing.owner.fullName ?? 'Chủ phòng trọ').replace(/\s*\(\d+\)\s*/g, '').trim();

  // FE-05: Lấy bất động sản tương tự từ API, chỉ fallback demo ở môi trường dev
  const isProduction = process.env.NODE_ENV === 'production';
  let similarListings: any[] = [];
  try {
    const similarRes = await fetchListings({
      propertyType: listing.propertyType,
      pageSize: '4',
    });
    similarListings = (similarRes.items || []).filter((item) => item.id !== listing.id).slice(0, 4);
  } catch {
    similarListings = isProduction
      ? []
      : ALL_DEMO_LISTINGS.filter((item) => item.id !== listing.id).slice(0, 4);
  }

  // Xử lý danh sách trường Đại học lân cận (từ DB hoặc tự động tính toán từ tọa độ Google Maps)
  const displayUnis = (() => {
    if (listing.nearbyUniversities && listing.nearbyUniversities.length > 0) {
      return listing.nearbyUniversities.map((item) => {
        const distKm = item.distanceMeters != null ? Number((item.distanceMeters / 1000).toFixed(1)) : 1;
        const distMeters = item.distanceMeters ?? Math.round(distKm * 1000);
        const timeMins = item.travelTimeMinutes ?? Math.max(1, Math.round((distKm / 22) * 60));
        return {
          name: item.university.name,
          abbreviation: item.university.abbreviation,
          address: item.university.address,
          distanceKm: distKm,
          distanceMeters: distMeters,
          travelTimeMinutes: timeMins,
        };
      });
    }

    if (listing.lat != null && listing.lng != null) {
      const computed = getNearbyUniversities(listing.lat, listing.lng, 10, 4);
      return computed.map((u) => ({
        name: u.name,
        abbreviation: u.abbreviation,
        address: u.address,
        distanceKm: u.distanceKm,
        distanceMeters: u.distanceMeters,
        travelTimeMinutes: u.travelTimeMinutes,
      }));
    }

    return [];
  })();

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="container-max py-6">
        {/* Breadcrumb điều hướng + nút Về danh sách */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-text-muted">
          <nav className="flex flex-wrap items-center gap-1.5">
            <Link href="/" className="hover:text-brand transition-colors">Trang chủ</Link>
            <span>›</span>
            <Link href="/thue" className="hover:text-brand transition-colors">Cho thuê phòng</Link>
            <span>›</span>
            <Link
              href={`/thue?locationSlug=${listing.location.slug}`}
              className="hover:text-brand transition-colors"
            >
              {listing.location.name}
            </Link>
            <span>›</span>
            <span className="text-text-secondary font-medium line-clamp-1 max-w-xs">{displayTitle}</span>
          </nav>

          <Link
            href="/thue"
            className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
          >
            ‹ Về danh sách
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cột trái — nội dung chính (2/3 chiều rộng) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Gallery ảnh */}
            <PropertyGallery images={listing.images} title={displayTitle} />

            {/* Tiêu đề + Địa chỉ + Giá */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="property-badge bg-brand text-white">
                  {PROPERTY_TYPE_LABEL[listing.propertyType] ?? 'Phòng cho thuê'}
                </span>
                {isSample && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                    Tin mẫu tham khảo
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-text-primary md:text-2xl leading-snug">{displayTitle}</h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-text-muted">
                <svg className="h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {listing.addressDetail ?? listing.location.name}
              </p>
              <div className="mt-3 flex items-baseline gap-2">
                <p className="text-2xl md:text-3xl font-bold text-brand">
                  {formatPrice(listing.price)}
                  <span className="text-sm md:text-base font-normal text-text-muted"> / tháng</span>
                </p>
              </div>
            </div>

            {/* Khối Chứng chỉ kiểm định thực tế (Trust-as-a-Service) */}
            {listing.verificationStatus === 'da_xac_thuc' && (
              <div className="rounded-2xl border-2 border-emerald-300/90 bg-gradient-to-r from-emerald-50 via-teal-50/40 to-white p-5 shadow-sm">
                <div className="flex items-start gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm text-xl">
                    🛡️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-800 text-base">
                        ✅ ĐÃ KIỂM TRA THỰC TẾ (Trust-as-a-Service)
                      </span>
                      <span className="inline-flex items-center rounded-full bg-emerald-100/90 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        Đã kiểm tra thực tế
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      Đội ngũ cộng tác viên địa phương đã đến trực tiếp địa chỉ này, chụp ảnh/quay video xác thực tình trạng phòng trọ, đồng hồ điện nước và trang thiết bị thực tế trước khi niêm yết trên sàn
                    </p>
                    {listing.verifiedAt && (
                      <p className="mt-2 text-[11px] text-emerald-700 font-medium">
                        Thời điểm kiểm tra: {new Date(listing.verifiedAt).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Khối Thông tin chính & Chi phí minh bạch (Chuẩn mẫu Mogi & USP QNS BROKER) */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
              <h2 className="mb-4 font-bold text-text-primary text-base">Thông tin chính & Biểu phí</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-4">
                <InfoRow label="Diện tích sử dụng" value={`${listing.areaM2} m²`} />
                <InfoRow
                  label="Ngày đăng"
                  value={listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                />
                <InfoRow
                  label="Tình trạng phòng"
                  value={(() => {
                    const lastConfirmed = (listing as any).refreshedAt || listing.publishedAt || listing.createdAt;
                    if (!lastConfirmed) return 'Còn phòng trống';
                    const days = Math.floor((Date.now() - new Date(lastConfirmed).getTime()) / 86_400_000);
                    if (days <= 7) return `🟢 Còn phòng (Xác nhận ${new Date(lastConfirmed).toLocaleDateString('vi-VN')})`;
                    return `🟡 Cần xác nhận lại (cập nhật ${days} ngày trước)`;
                  })()}
                />
                <InfoRow
                  label="Pháp lý"
                  value={listing.legalStatus ? (LEGAL_STATUS_LABEL[listing.legalStatus] ?? listing.legalStatus) : 'Không xác định'}
                />
                <InfoRow label="Mã BĐS" value={`#${listing.id}`} mono />
                <InfoRow
                  label="Tiền đặt cọc"
                  value={listing.depositAmount ? formatExactPrice(listing.depositAmount) : 'Thoả thuận / Không cọc'}
                />
                <InfoRow
                  label="Thời hạn hợp đồng"
                  value={listing.minLeaseMonths ? `Tối thiểu ${listing.minLeaseMonths} tháng` : 'Linh hoạt'}
                />
                <InfoRow
                  label="Chi phí điện"
                  value={
                    listing.utilitiesIncluded
                      ? 'Đã bao gồm'
                      : listing.electricityPricePerKwh
                        ? `${listing.electricityPricePerKwh.toLocaleString('vi-VN')} đ/kWh`
                        : 'Giá nhà nước / Thoả thuận'
                  }
                />
                <InfoRow
                  label="Chi phí nước"
                  value={
                    listing.utilitiesIncluded
                      ? 'Đã bao gồm'
                      : listing.waterPriceFlat
                        ? `${listing.waterPriceFlat.toLocaleString('vi-VN')} đ/người/tháng`
                        : listing.waterPricePerM3
                          ? `${listing.waterPricePerM3.toLocaleString('vi-VN')} đ/m³`
                          : 'Giá nhà nước / Thoả thuận'
                  }
                />
                {listing.bedrooms != null && <InfoRow label="Phòng ngủ" value={`${listing.bedrooms} phòng`} />}
                {listing.bathrooms != null && <InfoRow label="Phòng tắm / WC" value={`${listing.bathrooms} phòng`} />}
              </div>
            </div>

            {/* Khối Ước tính chi phí dọn vào ở (MoveInCostEstimator) */}
            <MoveInCostEstimator
              initialRentPrice={listing.price}
              depositAmount={listing.depositAmount}
              electricityPricePerKwh={listing.electricityPricePerKwh}
              waterPricePerM3={listing.waterPricePerM3}
              waterPriceFlat={listing.waterPriceFlat}
              utilitiesIncluded={listing.utilitiesIncluded}
            />

            {/* Khối Giới thiệu (Chuẩn mẫu Mogi) */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-4">
              <h2 className="font-bold text-text-primary text-base">Giới thiệu</h2>
              <div className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                {listing.description || 'Chưa có thông tin mô tả chi tiết cho bất động sản này'}
              </div>

              {/* Báo vi phạm */}
              <ReportListingModal listingId={listing.id} />

              {/* Tóm tắt người đăng bên dưới mô tả */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {cleanOwnerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-sm font-bold text-text-primary">{cleanOwnerName}</p>
                    {listing.owner.isIdVerified && (
                      <span
                        title="Danh tính / CCCD đã xác thực"
                        className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700"
                      >
                        <span>🛡️</span>
                        <span>CCCD</span>
                      </span>
                    )}
                    {listing.owner.isPhoneVerified && (
                      <span
                        title="Số điện thoại đã xác thực OTP"
                        className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700"
                      >
                        <span>✓</span>
                        <span>SĐT</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">Đã tham gia: {formatJoinedDuration(listing.owner.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Khối Bản đồ Google Maps & Tiện ích vị trí */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h2 className="font-bold text-text-primary text-base flex items-center gap-1.5">
                    <span className="text-red-500">📍</span>
                    <span>Vị trí trên Google Maps & Tiện ích xung quanh</span>
                  </h2>
                  <p className="text-xs text-text-muted mt-0.5">
                    {listing.addressDetail ? `${listing.addressDetail}, ${listing.location.name}` : listing.location.name}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={getGoogleMapsDirectionsUrl(
                      listing.lat != null && listing.lng != null
                        ? { lat: listing.lat, lng: listing.lng }
                        : { address: listing.addressDetail ?? listing.location.name },
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl bg-brand px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-hover transition-colors shadow-xs"
                  >
                    <span>🧭</span>
                    <span>Chỉ đường trên Google Maps</span>
                  </a>
                  <a
                    href={getGoogleMapsViewUrl(
                      listing.lat != null && listing.lng != null
                        ? { lat: listing.lat, lng: listing.lng }
                        : { address: listing.addressDetail ?? listing.location.name },
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-surface-border bg-white px-3 py-1.5 text-xs font-semibold text-text-secondary hover:border-brand/40 hover:text-brand transition-colors"
                  >
                    <span>Mở bản đồ lớn</span>
                    <span>↗</span>
                  </a>
                </div>
              </div>

              <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-xl border border-surface-border bg-slate-100 shadow-inner">
                <iframe
                  title={`Bản đồ vị trí ${listing.addressDetail ?? listing.location.name}`}
                  src={getGoogleMapsEmbedUrl(
                    listing.lat != null && listing.lng != null
                      ? { lat: listing.lat, lng: listing.lng }
                      : { address: listing.addressDetail ?? listing.location.name },
                  )}
                  className="h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                />
              </div>

              {/* Danh sách trường Đại học lân cận */}
              {displayUnis.length > 0 && (
                <div className="pt-3 border-t border-surface-border space-y-2.5">
                  <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                    <span>🎓</span>
                    <span>Khoảng cách tới các trường Đại học lân cận</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {displayUnis.map((uni, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between gap-2 rounded-xl border border-surface-border bg-slate-50/70 p-2.5 hover:border-brand/30 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">
                            {uni.abbreviation ? `[${uni.abbreviation}] ` : ''}
                            {uni.name}
                          </p>
                          {uni.address && (
                            <p className="text-[11px] text-text-muted truncate mt-0.5">{uni.address}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                            {uni.distanceKm < 1 ? `~${uni.distanceMeters}m` : `~${uni.distanceKm} km`}
                          </span>
                          <p className="text-[10px] text-text-muted mt-0.5">~{uni.travelTimeMinutes} phút xe máy</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Khối Bất động sản tương tự (Chuẩn mẫu Mogi) */}
            {similarListings.length > 0 && (
              <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-4">
                <h2 className="font-bold text-text-primary text-base">Bất động sản tương tự</h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {similarListings.map((item) => (
                    <Link
                      key={item.id}
                      href={`/tin/${item.slug}`}
                      className="group flex flex-col justify-between overflow-hidden rounded-xl border border-surface-border bg-white hover:border-brand/40 hover:shadow-sm transition-all"
                    >
                      <div>
                        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                          {item.images[0]?.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.images[0].imageUrl}
                              alt={item.title}
                              loading="lazy"
                              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-slate-300">
                              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 space-y-1">
                          <p className="line-clamp-2 text-xs font-semibold text-text-primary group-hover:text-brand transition-colors leading-snug">
                            {item.title.replace(/^\[MẪU\]\s*/, '')}
                          </p>
                          {item.areaM2 && (
                            <p className="text-[11px] text-text-muted">{item.areaM2} m²</p>
                          )}
                        </div>
                      </div>
                      <div className="px-2.5 pb-2.5">
                        <p className="text-xs md:text-sm font-bold text-brand">{formatPrice(item.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cột phải — Sidebar người đăng & an toàn (1/3 chiều rộng) */}
          <aside>
            <div className="sticky top-24 space-y-4">
              {/* Box liên hệ người tư vấn & dẫn xem (BR-01, BR-02) */}
              <OwnerContactBox
                listingId={listing.id}
                ownerName={cleanOwnerName}
                joinedText={formatJoinedDuration(listing.owner.createdAt)}
                listingTitle={displayTitle}
                isPhoneVerified={listing.owner.isPhoneVerified}
                isIdVerified={listing.owner.isIdVerified}
                contactAgent={(listing as any).contactAgent}
              />

              {/* Khối Lưu ý an toàn khi thuê trọ */}
              <div className="rounded-2xl bg-gradient-to-br from-brand/5 to-brand/10 border border-brand/20 p-4">
                <p className="text-sm font-semibold text-brand flex items-center gap-1.5">
                  <span>🛡️</span>
                  <span>Lưu ý an toàn khi thuê phòng</span>
                </p>
                <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand font-bold">•</span>
                    <span>Luôn đến xem phòng trực tiếp trước khi quyết định đặt cọc</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand font-bold">•</span>
                    <span>Kiểm tra thực tế đồng hồ điện nước, công tơ riêng từng phòng</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand font-bold">•</span>
                    <span>Ký hợp đồng thuê bằng văn bản có đầy đủ chữ ký của hai bên</span>
                  </li>
                </ul>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile Sticky Contact Bar (FE-10) */}
      <MobileStickyContactBar
        listingId={listing.id}
        listingTitle={displayTitle}
        priceFormatted={formatExactPrice(listing.price)}
        depositFormatted={listing.depositAmount ? formatExactPrice(listing.depositAmount) : undefined}
      />
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
