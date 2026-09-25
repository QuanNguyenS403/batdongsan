'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { VIETNAM_UNIVERSITIES } from '@/lib/vietnam-universities';

interface UniversityOption {
  slug: string;
  name: string;
  abbreviation?: string | null;
  region?: string;
}

interface SearchFilterBarProps {
  basePath: string; // '/thue', '/cho-thue-tro', '/cho-thue-mat-bang'
  transactionType?: 'rent';
  initialParams?: { [key: string]: string | undefined };
  propertyTypes?: { value: string; label: string }[];
  universities?: UniversityOption[];
  customPricePresets?: { label: string; min: string; max: string }[];
  customAreaPresets?: { label: string; min: string; max: string }[];
  placeholder?: string;
}

export const PROPERTY_TYPES_CAN_HO = [
  { value: '', label: 'Tất cả loại căn hộ' },
  { value: 'can_ho_chung_cu', label: 'Căn hộ chung cư' },
  { value: 'can_ho_mini', label: 'Căn hộ mini' },
  { value: 'can_ho_dich_vu', label: 'Căn hộ dịch vụ' },
  { value: 'can_ho_cao_cap', label: 'Căn hộ cao cấp' },
];

export const PROPERTY_TYPES_STUDIO = [
  { value: '', label: 'Tất cả loại Studio' },
  { value: 'studio', label: 'Studio tiêu chuẩn' },
  { value: 'studio_ban_cong', label: 'Studio ban công thoáng mát' },
  { value: 'studio_gac_lung', label: 'Studio duplex / gác lửng' },
  { value: 'studio_full_noi_that', label: 'Studio full nội thất' },
];

const PROPERTY_TYPES = [
  { value: '', label: 'Tất cả loại phòng' },
  { value: 'can_ho', label: 'Căn hộ' },
  { value: 'studio', label: 'Studio' },
  { value: 'phong_tro', label: 'Phòng trọ sinh viên' },
  { value: 'ky_tuc_xa', label: 'Ký túc xá / Sleepbox' },
  { value: 'nha_rieng', label: 'Nhà riêng / Nguyên căn' },
  { value: 'mat_bang', label: 'Mặt bằng kinh doanh' },
];

const DEFAULT_UNIVERSITIES: UniversityOption[] = VIETNAM_UNIVERSITIES;

const PRICE_PRESETS_RENT = [
  { label: 'Tất cả mức giá thuê', min: '', max: '' },
  { label: 'Dưới 2 triệu', min: '', max: '2000000' },
  { label: '2 - 3.5 triệu', min: '2000000', max: '3500000' },
  { label: '3.5 - 5 triệu', min: '3500000', max: '5000000' },
  { label: '5 - 8 triệu', min: '5000000', max: '8000000' },
  { label: '8 - 15 triệu', min: '8000000', max: '15000000' },
  { label: 'Trên 15 triệu', min: '15000000', max: '' },
];

const AREA_PRESETS = [
  { label: 'Tất cả diện tích', min: '', max: '' },
  { label: 'Dưới 20 m²', min: '', max: '20' },
  { label: '20 - 35 m²', min: '20', max: '35' },
  { label: '35 - 50 m²', min: '35', max: '50' },
  { label: '50 - 80 m²', min: '50', max: '80' },
  { label: 'Trên 80 m²', min: '80', max: '' },
];

export function SearchFilterBar({
  basePath,
  initialParams = {},
  propertyTypes: propPropertyTypes,
  universities = DEFAULT_UNIVERSITIES,
  customPricePresets,
  customAreaPresets,
  placeholder = 'Tìm theo tiêu đề, đường, trường ĐH...',
}: SearchFilterBarProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [keyword, setKeyword] = useState(initialParams.keyword ?? '');
  const [propertyType, setPropertyType] = useState(initialParams.propertyType ?? '');
  const [universitySlug, setUniversitySlug] = useState(initialParams.universitySlug ?? '');
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(initialParams.utilitiesIncluded === 'true');

  const availablePropertyTypes =
    propPropertyTypes ??
    (initialParams.categoryGroup === 'thue_studio'
      ? PROPERTY_TYPES_STUDIO
      : initialParams.categoryGroup === 'thue_can_ho'
        ? PROPERTY_TYPES_CAN_HO
        : PROPERTY_TYPES);

  // Tìm preset giá tương ứng
  const pricePresets = customPricePresets ?? PRICE_PRESETS_RENT;
  const initialPriceIndex = pricePresets.findIndex(
    (p) => p.min === (initialParams.priceMin ?? '') && p.max === (initialParams.priceMax ?? ''),
  );
  const [priceIndex, setPriceIndex] = useState(initialPriceIndex >= 0 ? initialPriceIndex : 0);

  // Tìm preset diện tích tương ứng
  const areaPresets = customAreaPresets ?? AREA_PRESETS;
  const initialAreaIndex = areaPresets.findIndex(
    (a) => a.min === (initialParams.areaMin ?? '') && a.max === (initialParams.areaMax ?? ''),
  );
  const [areaIndex, setAreaIndex] = useState(initialAreaIndex >= 0 ? initialAreaIndex : 0);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();

    // FE-N10: Giữ nguyên location filter khi áp dụng bộ lọc hoặc đổi loại phòng
    if (initialParams.locationSlug) params.set('locationSlug', initialParams.locationSlug);
    if (initialParams.locationId) params.set('locationId', initialParams.locationId);
    if (initialParams.categoryGroup) params.set('categoryGroup', initialParams.categoryGroup);
    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (propertyType) params.set('propertyType', propertyType);
    if (universitySlug) params.set('universitySlug', universitySlug);
    if (utilitiesIncluded) params.set('utilitiesIncluded', 'true');

    const price = pricePresets[priceIndex];
    if (price.min) params.set('priceMin', price.min);
    if (price.max) params.set('priceMax', price.max);

    const area = areaPresets[areaIndex];
    if (area?.min) params.set('areaMin', area.min);
    if (area?.max) params.set('areaMax', area.max);

    // Reset về trang 1 khi lọc mới
    params.set('page', '1');

    startTransition(() => {
      router.push(`${basePath}?${params.toString()}`);
    });
  }

  function handleReset() {
    setKeyword('');
    setPropertyType('');
    setUniversitySlug('');
    setUtilitiesIncluded(false);
    setPriceIndex(0);
    setAreaIndex(0);
    startTransition(() => {
      const resetParams = new URLSearchParams();
      if (initialParams.locationSlug) resetParams.set('locationSlug', initialParams.locationSlug);
      if (initialParams.locationId) resetParams.set('locationId', initialParams.locationId);
      if (initialParams.categoryGroup) resetParams.set('categoryGroup', initialParams.categoryGroup);
      const queryStr = resetParams.toString();
      router.push(queryStr ? `${basePath}?${queryStr}` : basePath);
    });
  }

  const hasFilters = !!(
    keyword ||
    propertyType ||
    universitySlug ||
    utilitiesIncluded ||
    pricePresets[priceIndex].min ||
    pricePresets[priceIndex].max ||
    areaPresets[areaIndex].min ||
    areaPresets[areaIndex].max
  );

  return (
    <form onSubmit={handleFilter} className="mb-6 rounded-2xl border border-surface-border bg-white p-4 shadow-card">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
        {/* Từ khoá */}
        <div className="lg:col-span-2">
          <input
            type="text"
            placeholder={placeholder}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="input-field"
          />
        </div>

        {/* Trường Đại học */}
        <div>
          <select
            value={universitySlug}
            onChange={(e) => setUniversitySlug(e.target.value)}
            className="filter-select"
          >
            <option value="">🎓 Gần trường ĐH (Toàn quốc)</option>
            {['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng & Miền Trung', 'Cần Thơ & Miền Tây', 'Miền Bắc khác'].map((reg) => {
              const items = universities.filter((u) => u.region === reg);
              if (items.length === 0) return null;
              return (
                <optgroup key={reg} label={`🏛️ ${reg}`}>
                  {items.map((u) => (
                    <option key={u.slug} value={u.slug}>
                      {u.abbreviation ? `${u.abbreviation} — ${u.name}` : u.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
            {/* Fallback cho trường hợp universities không có trường region */}
            {universities.some((u) => !u.region) &&
              universities
                .filter((u) => !u.region)
                .map((u) => (
                  <option key={u.slug} value={u.slug}>
                    {u.abbreviation ? `${u.abbreviation} — ${u.name}` : u.name}
                  </option>
                ))}
          </select>
        </div>

        {/* Loại BĐS */}
        <div>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="filter-select"
          >
            {availablePropertyTypes.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        {/* Mức giá */}
        <div>
          <select
            value={priceIndex}
            onChange={(e) => setPriceIndex(Number(e.target.value))}
            className="filter-select"
          >
            {pricePresets.map((p, idx) => (
              <option key={idx} value={idx}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Diện tích */}
        <div>
          <select
            value={areaIndex}
            onChange={(e) => setAreaIndex(Number(e.target.value))}
            className="filter-select"
          >
            {areaPresets.map((a, idx) => (
              <option key={idx} value={idx}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quick filter pills */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-surface-border pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setUtilitiesIncluded(!utilitiesIncluded)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
              utilitiesIncluded
                ? 'border-brand bg-brand/10 text-brand font-semibold'
                : 'border-surface-border bg-surface text-text-secondary hover:bg-surface-muted'
            }`}
          >
            <span>⚡💧</span>
            <span>Bao điện nước</span>
          </button>

          <span className="text-xs text-text-muted hidden sm:inline">Gợi ý tìm nhanh:</span>
          {[
            'dh-bach-khoa-ha-noi',
            'dh-kinh-te-quoc-dan',
            'dh-kinh-doanh-cong-nghe-ha-noi',
            'dh-ngoai-thuong-hn',
            'dhqg-ha-noi',
            'dhqg-tphcm',
            'dh-bach-khoa-tphcm',
            'dh-ton-duc-thang',
          ].map((uSlug) => {
            const u = universities.find((x) => x.slug === uSlug);
            if (!u) return null;
            const active = universitySlug === uSlug;
            return (
              <button
                key={uSlug}
                type="button"
                onClick={() => setUniversitySlug(active ? '' : uSlug)}
                className={`rounded-full px-2.5 py-0.5 text-xs transition-colors border ${
                  active
                    ? 'border-brand bg-brand text-white font-medium'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-brand/40'
                }`}
              >
                Gần {u.abbreviation || u.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          {hasFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="btn-secondary text-xs px-4 py-2"
            >
              Đặt lại
            </button>
          )}
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary text-xs px-5 py-2 disabled:opacity-75"
          >
            {isPending ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Đang lọc...</span>
              </>
            ) : (
              <>
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
                <span>Lọc kết quả</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
