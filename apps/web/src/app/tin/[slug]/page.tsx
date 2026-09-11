import { cache } from 'react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { fetchListingBySlug, formatPrice } from '@/lib/api';
import { ALL_DEMO_LISTINGS } from '@/lib/demo-data';
import { PropertyGallery } from './PropertyGallery';
import { ReportListingModal } from '@/components/ReportListingModal';
import { OwnerContactBox } from './OwnerContactBox';

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
      description: 'Thông tin chi tiết phòng trọ, căn hộ, studio cho thuê chính chủ.',
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

  // Lấy các bất động sản tương tự
  const similarListings = ALL_DEMO_LISTINGS
    .filter((item) => item.id !== listing.id)
    .slice(0, 4);

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

            {/* Khối Thông tin chính (Chuẩn mẫu Mogi) */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card">
              <h2 className="mb-4 font-bold text-text-primary text-base">Thông tin chính</h2>
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-4">
                <InfoRow label="Diện tích sử dụng" value={`${listing.areaM2} m²`} />
                <InfoRow
                  label="Ngày đăng"
                  value={listing.publishedAt ? new Date(listing.publishedAt).toLocaleDateString('vi-VN') : 'Mới cập nhật'}
                />
                <InfoRow
                  label="Pháp lý"
                  value={listing.legalStatus ? (LEGAL_STATUS_LABEL[listing.legalStatus] ?? listing.legalStatus) : 'Không xác định'}
                />
                <InfoRow label="Mã BĐS" value={`#${listing.id}`} mono />
                {listing.bedrooms != null && <InfoRow label="Phòng ngủ" value={`${listing.bedrooms} phòng`} />}
                {listing.bathrooms != null && <InfoRow label="Phòng tắm / WC" value={`${listing.bathrooms} phòng`} />}
              </div>
            </div>

            {/* Khối Giới thiệu (Chuẩn mẫu Mogi) */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-4">
              <h2 className="font-bold text-text-primary text-base">Giới thiệu</h2>
              <div className="whitespace-pre-line text-sm leading-relaxed text-text-secondary">
                {listing.description || 'Chưa có thông tin mô tả chi tiết cho bất động sản này.'}
              </div>

              {/* Báo vi phạm */}
              <ReportListingModal listingId={listing.id} />

              {/* Tóm tắt người đăng bên dưới mô tả */}
              <div className="flex items-center gap-3 pt-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-bold text-brand">
                  {cleanOwnerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-bold text-text-primary">{cleanOwnerName}</p>
                    <span
                      title="Tài khoản đã xác thực"
                      className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#1877F2] text-[9px] text-white font-bold"
                    >
                      ✓
                    </span>
                  </div>
                  <p className="text-xs text-text-muted">Đã tham gia: {formatJoinedDuration(listing.owner.createdAt)}</p>
                </div>
              </div>
            </div>

            {/* Khối Tiện ích xung quanh & Bản đồ (Chuẩn mẫu Mogi) */}
            <div className="rounded-2xl border border-surface-border bg-white p-5 shadow-card space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-text-primary text-base">Tiện ích xung quanh</h2>
                <span className="text-xs text-text-muted">{listing.location.name}</span>
              </div>
              <div className="relative aspect-[16/9] md:aspect-[21/9] w-full overflow-hidden rounded-xl border border-surface-border bg-slate-100">
                <iframe
                  title={`Bản đồ vị trí ${listing.addressDetail ?? listing.location.name}`}
                  src={`https://maps.google.com/maps?q=${encodeURIComponent(listing.addressDetail ?? listing.location.name)}&t=&z=15&ie=UTF8&iwloc=&output=embed`}
                  className="h-full w-full border-0"
                  loading="lazy"
                  allowFullScreen
                />
              </div>
              <p className="flex items-center gap-1.5 text-xs text-text-muted">
                <svg className="h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {listing.addressDetail ?? listing.location.name}
              </p>
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
              {/* Box liên hệ người đăng */}
              <OwnerContactBox
                listingId={listing.id}
                ownerName={cleanOwnerName}
                joinedText={formatJoinedDuration(listing.owner.createdAt)}
                listingTitle={displayTitle}
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
                    <span>Luôn đến xem phòng trực tiếp trước khi quyết định đặt cọc.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand font-bold">•</span>
                    <span>Kiểm tra thực tế đồng hồ điện nước, công tơ riêng từng phòng.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <span className="text-brand font-bold">•</span>
                    <span>Ký hợp đồng thuê bằng văn bản có đầy đủ chữ ký của hai bên.</span>
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
