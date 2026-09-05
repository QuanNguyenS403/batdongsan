import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchListingBySlug, formatPrice } from '@/lib/api';
import { ALL_DEMO_LISTINGS } from '@/lib/demo-data';
import { RevealPhoneButton } from './RevealPhoneButton';
import { SaveListingButton } from './SaveListingButton';
import { MoveInCostEstimator } from '@/components/MoveInCostEstimator';
import { ReportListingModal } from '@/components/ReportListingModal';
import { PropertyGallery } from './PropertyGallery';

interface Props {
  params: { slug: string };
}

// React cache() tự động deduplicate request giữa generateMetadata và ListingDetailPage
const getListingOrNotFound = cache(async (slug: string) => {
  try {
    return await fetchListingBySlug(slug);
  } catch {
    const demo = ALL_DEMO_LISTINGS.find((item) => item.slug === slug);
    if (demo) return demo;
    notFound();
  }
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const listing = await getListingOrNotFound(params.slug);
    const desc = listing.description?.slice(0, 160) ?? `${listing.title} tại ${listing.location.name}`;
    return {
      title: `${listing.title} | Thuê Trọ Nhanh`,
      description: desc,
      openGraph: {
        title: listing.title,
        description: desc,
        images: listing.images[0] ? [listing.images[0].imageUrl] : [],
      },
    };
  } catch {
    return {
      title: 'Chi tiết phòng cho thuê | Thuê Trọ Nhanh',
      description: 'Thông tin chi tiết phòng trọ, căn hộ, studio cho thuê chính chủ, minh bạch điện nước.',
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
  'can-ho-chung-cu': 'Căn hộ chung cư',
  'can_ho_chung_cu': 'Căn hộ chung cư',
  'can-ho': 'Căn hộ chung cư',
  'can_ho': 'Căn hộ chung cư',
  'studio': 'Căn hộ Studio',
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

const AMENITY_MAP: Record<string, { label: string; icon: string }> = {
  wifi: { label: 'Wifi tốc độ cao', icon: '📶' },
  air_conditioner: { label: 'Máy lạnh / Điều hòa', icon: '❄️' },
  mezzanine: { label: 'Gác lửng đúc kiên cố', icon: '🪜' },
  parking: { label: 'Nhà để xe có bảo vệ/thẻ từ', icon: '🛵' },
  security_camera: { label: 'Camera / An ninh 24/7', icon: '📹' },
  free_time: { label: 'Giờ giấc tự do 24/24', icon: '🔑' },
  private_bathroom: { label: 'Vệ sinh khép kín', icon: '🚿' },
  water_heater: { label: 'Bình nóng lạnh', icon: '♨️' },
  washing_machine: { label: 'Máy giặt chung/riêng', icon: '🧺' },
  refrigerator: { label: 'Tủ lạnh sẵn phòng', icon: '🧊' },
  kitchen: { label: 'Kệ bếp nấu ăn thoải mái', icon: '🍳' },
  elevator: { label: 'Thang máy di chuyển', icon: '🛗' },
  balcony: { label: 'Ban công / Cửa sổ thoáng gió', icon: '🪟' },
  fingerprint_lock: { label: 'Cửa khóa vân tay hiện đại', icon: '🔒' },
};

export default async function ListingDetailPage({ params }: Props) {
  const listing = await getListingOrNotFound(params.slug);

  const isSample = listing.title.startsWith('[MẪU]');
  const displayTitle = isSample ? listing.title.replace(/^\[MẪU\]\s*/, '') : listing.title;

  // Trích xuất danh sách tiện ích
  const amenityKeys = Array.isArray(listing.amenities)
    ? (listing.amenities as string[])
    : typeof listing.amenities === 'object' && listing.amenities !== null
      ? Object.keys(listing.amenities).filter((k) => (listing.amenities as any)[k])
      : [];

  const nearbyUnis = listing.nearbyUniversities ?? [];

  return (
    <div className="min-h-screen bg-surface-muted">
      <div className="container-max py-6">
        {/* Breadcrumb 4 cấp */}
        <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Cột trái — nội dung chính */}
          <div className="lg:col-span-2 space-y-5">
            {/* Gallery tương tác mượt mà */}
            <PropertyGallery images={listing.images} title={displayTitle} />

            {/* Tiêu đề + giá */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="property-badge bg-brand text-white">
                      {PROPERTY_TYPE_LABEL[listing.propertyType] ?? 'Phòng cho thuê'}
                    </span>
                    {listing.utilitiesIncluded && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        ⚡ Miễn phí điện nước
                      </span>
                    )}
                    {isSample && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                        Tin mẫu tham khảo
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl font-bold text-text-primary md:text-2xl">{displayTitle}</h1>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-text-muted">
                    <svg className="h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    {listing.addressDetail ?? listing.location.name}
                  </p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-brand">
                      {formatPrice(listing.price)}
                      <span className="text-base font-normal text-text-muted"> / tháng</span>
                    </p>
                    {listing.depositAmount != null && Number(listing.depositAmount) > 0 && (
                      <span className="text-xs text-text-muted bg-surface-muted px-2 py-1 rounded-lg border border-surface-border">
                        Cọc: <strong className="text-text-primary">{formatPrice(listing.depositAmount)}</strong>
                      </span>
                    )}
                  </div>
                </div>
                <SaveListingButton listingId={listing.id} />
              </div>
            </div>

            {/* Chi phí dịch vụ minh bạch (Cốt lõi cho sinh viên & người đi thuê) */}
            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 via-white to-white p-5 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-sm font-bold">
                  ✓
                </span>
                <h2 className="font-bold text-text-primary">Minh bạch chi phí dịch vụ & Điện nước</h2>
              </div>
              <p className="text-xs text-text-muted mb-4">
                Không lo phát sinh chi phí ẩn khi dọn vào. Chủ phòng cam kết biểu giá niêm yết rõ ràng.
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-surface-border bg-white p-3 text-center">
                  <p className="text-xs text-text-muted">⚡ Giá điện</p>
                  <p className="mt-1 text-sm font-bold text-text-primary">
                    {listing.utilitiesIncluded
                      ? 'Đã bao gồm'
                      : listing.electricityPricePerKwh
                        ? `${listing.electricityPricePerKwh.toLocaleString('vi-VN')} đ/kWh`
                        : 'Thoả thuận'}
                  </p>
                </div>
                <div className="rounded-xl border border-surface-border bg-white p-3 text-center">
                  <p className="text-xs text-text-muted">💧 Giá nước</p>
                  <p className="mt-1 text-sm font-bold text-text-primary">
                    {listing.utilitiesIncluded
                      ? 'Đã bao gồm'
                      : listing.waterPricePerM3
                        ? `${listing.waterPricePerM3.toLocaleString('vi-VN')} đ/m³`
                        : listing.waterPriceFlat
                          ? `${listing.waterPriceFlat.toLocaleString('vi-VN')} đ/người`
                          : 'Thoả thuận'}
                  </p>
                </div>
                <div className="rounded-xl border border-surface-border bg-white p-3 text-center">
                  <p className="text-xs text-text-muted">🛡️ Tiền đặt cọc</p>
                  <p className="mt-1 text-sm font-bold text-brand">
                    {listing.depositAmount ? formatPrice(listing.depositAmount) : '1 tháng tiền phòng'}
                  </p>
                </div>
                <div className="rounded-xl border border-surface-border bg-white p-3 text-center">
                  <p className="text-xs text-text-muted">⏳ Hợp đồng tối thiểu</p>
                  <p className="mt-1 text-sm font-bold text-text-primary">
                    {listing.minLeaseMonths ? `${listing.minLeaseMonths} tháng` : 'Linh hoạt'}
                  </p>
                </div>
              </div>
            </div>

            {/* Các trường đại học lân cận */}
            {nearbyUnis.length > 0 && (
              <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🎓</span>
                  <h2 className="font-semibold text-text-primary">Gần các trường Đại học</h2>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {nearbyUnis.map((item, idx) => {
                    const uni = item.university;
                    const km = item.distanceMeters ? (item.distanceMeters / 1000).toFixed(1) : null;
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-muted/60 p-3 hover:border-brand/40 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/10 text-xs font-bold text-brand shrink-0">
                            {uni.abbreviation ?? 'ĐH'}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-text-primary line-clamp-1">{uni.name}</p>
                            {uni.address && <p className="text-[11px] text-text-muted line-clamp-1">{uni.address}</p>}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          {km && <p className="text-xs font-bold text-brand">~{km} km</p>}
                          {item.travelTimeMinutes && (
                            <p className="text-[10px] text-text-muted">{item.travelTimeMinutes} phút xe</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Thông tin phòng cơ bản */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
              <h2 className="mb-4 font-semibold text-text-primary">Thông tin chi tiết căn phòng</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
                <InfoRow label="Diện tích sử dụng" value={`${listing.areaM2} m²`} />
                {listing.bedrooms != null && <InfoRow label="Phòng ngủ" value={`${listing.bedrooms} phòng`} />}
                {listing.bathrooms != null && <InfoRow label="Phòng tắm / WC" value={`${listing.bathrooms} phòng`} />}
                <InfoRow
                  label="Loại phòng"
                  value={PROPERTY_TYPE_LABEL[listing.propertyType] ?? listing.propertyType}
                />
                <InfoRow
                  label="Ngày đăng tin"
                  value={listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                />
                <InfoRow label="Mã tin đăng" value={`#${listing.id}`} mono />
              </div>
            </div>

            {/* Danh sách tiện ích */}
            {amenityKeys.length > 0 && (
              <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
                <h2 className="mb-3 font-semibold text-text-primary">Tiện ích & Cơ sở vật chất sẵn có</h2>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {amenityKeys.map((key) => {
                    const info = AMENITY_MAP[key] ?? { label: key, icon: '✨' };
                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2 text-xs font-medium text-text-secondary border border-surface-border"
                      >
                        <span className="text-base">{info.icon}</span>
                        <span>{info.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mô tả */}
            {listing.description && (
              <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
                <h2 className="mb-3 font-semibold text-text-primary">Mô tả từ chủ nhà</h2>
                <div className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                  {listing.description}
                </div>
              </div>
            )}

            {/* Công cụ ước tính chi phí dọn vào tháng đầu */}
            <div id="cost-estimator">
              <MoveInCostEstimator
                initialRentPrice={listing.price}
                depositAmount={listing.depositAmount}
                electricityPricePerKwh={listing.electricityPricePerKwh}
                waterPricePerM3={listing.waterPricePerM3}
                waterPriceFlat={listing.waterPriceFlat}
                utilitiesIncluded={listing.utilitiesIncluded}
              />
            </div>

            {/* Báo vi phạm */}
            <ReportListingModal listingId={listing.id} />
          </div>

          {/* Cột phải — sidebar liên hệ */}
          <aside>
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
                <h3 className="mb-4 text-sm font-semibold text-text-muted uppercase tracking-wide">
                  Thông tin chủ phòng / Môi giới
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 text-lg font-bold text-brand">
                    {(listing.owner.fullName ?? 'U').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary">{listing.owner.fullName ?? 'Chủ phòng trọ'}</p>
                    <p className="text-xs text-text-muted">
                      Đã tham gia{' '}
                      {Math.max(1, Math.floor((Date.now() - new Date(listing.owner.createdAt).getTime()) / 86_400_000))}{' '}
                      ngày
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-2.5">
                  <RevealPhoneButton listingId={listing.id} />
                  <a
                    href="#cost-estimator"
                    className="btn-secondary w-full text-center flex items-center justify-center gap-1.5"
                  >
                    <span>🧮</span>
                    <span>Ước tính phí dọn vào</span>
                  </a>
                </div>
              </div>

              {/* Lời khuyên an toàn khi thuê trọ */}
              <div className="rounded-2xl bg-gradient-to-br from-brand/5 to-brand/10 border border-brand/20 p-4">
                <p className="text-sm font-semibold text-brand">🛡️ Lưu ý an toàn khi thuê trọ</p>
                <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand font-bold">•</span>
                    <span>Luôn đến xem phòng trực tiếp trước khi quyết định đặt cọc.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand font-bold">•</span>
                    <span>Kiểm tra kỹ đồng hồ điện nước, công tơ riêng từng phòng.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand font-bold">•</span>
                    <span>Yêu cầu hợp đồng thuê bằng văn bản có đủ chữ ký hai bên.</span>
                  </li>
                </ul>
              </div>
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
