'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface SearchFilterBarProps {
  basePath: string; // '/mua-ban' hoặc '/thue'
  transactionType?: 'sale' | 'rent';
  initialParams?: { [key: string]: string | undefined };
}

const PROPERTY_TYPES = [
  { value: '', label: 'Tất cả loại BĐS' },
  { value: 'can-ho', label: 'Căn hộ / Chung cư' },
  { value: 'nha-nguyen-can', label: 'Nhà riêng / Nhà phố' },
  { value: 'dat', label: 'Đất nền / Đất thổ cư' },
  { value: 'shophouse', label: 'Shophouse / Mặt tiền' },
  { value: 'phong-tro', label: 'Phòng trọ / Nhà trọ' },
];

const PRICE_PRESETS_SALE = [
  { label: 'Tất cả mức giá', min: '', max: '' },
  { label: 'Dưới 1 tỷ', min: '', max: '1000000000' },
  { label: '1 - 2 tỷ', min: '1000000000', max: '2000000000' },
  { label: '2 - 3 tỷ', min: '2000000000', max: '3000000000' },
  { label: '3 - 5 tỷ', min: '3000000000', max: '5000000000' },
  { label: '5 - 10 tỷ', min: '5000000000', max: '10000000000' },
  { label: 'Trên 10 tỷ', min: '10000000000', max: '' },
];

const PRICE_PRESETS_RENT = [
  { label: 'Tất cả mức giá', min: '', max: '' },
  { label: 'Dưới 5 triệu', min: '', max: '5000000' },
  { label: '5 - 10 triệu', min: '5000000', max: '10000000' },
  { label: '10 - 20 triệu', min: '10000000', max: '20000000' },
  { label: '20 - 40 triệu', min: '20000000', max: '40000000' },
  { label: 'Trên 40 triệu', min: '40000000', max: '' },
];

const AREA_PRESETS = [
  { label: 'Tất cả diện tích', min: '', max: '' },
  { label: 'Dưới 30 m²', min: '', max: '30' },
  { label: '30 - 50 m²', min: '30', max: '50' },
  { label: '50 - 80 m²', min: '50', max: '80' },
  { label: '80 - 150 m²', min: '80', max: '150' },
  { label: 'Trên 150 m²', min: '150', max: '' },
];

export function SearchFilterBar({ basePath, transactionType = 'sale', initialParams = {} }: SearchFilterBarProps) {
  const router = useRouter();

  const [keyword, setKeyword] = useState(initialParams.keyword ?? '');
  const [propertyType, setPropertyType] = useState(initialParams.propertyType ?? '');

  // Tìm preset giá tương ứng
  const pricePresets = transactionType === 'rent' ? PRICE_PRESETS_RENT : PRICE_PRESETS_SALE;
  const initialPriceIndex = pricePresets.findIndex(
    (p) => p.min === (initialParams.priceMin ?? '') && p.max === (initialParams.priceMax ?? ''),
  );
  const [priceIndex, setPriceIndex] = useState(initialPriceIndex >= 0 ? initialPriceIndex : 0);

  // Tìm preset diện tích tương ứng
  const initialAreaIndex = AREA_PRESETS.findIndex(
    (a) => a.min === (initialParams.areaMin ?? '') && a.max === (initialParams.areaMax ?? ''),
  );
  const [areaIndex, setAreaIndex] = useState(initialAreaIndex >= 0 ? initialAreaIndex : 0);

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();

    if (keyword.trim()) params.set('keyword', keyword.trim());
    if (propertyType) params.set('propertyType', propertyType);

    const price = pricePresets[priceIndex];
    if (price.min) params.set('priceMin', price.min);
    if (price.max) params.set('priceMax', price.max);

    const area = AREA_PRESETS[areaIndex];
    if (area.min) params.set('areaMin', area.min);
    if (area.max) params.set('areaMax', area.max);

    // Reset về trang 1 khi lọc mới
    params.set('page', '1');

    router.push(`${basePath}?${params.toString()}`);
  }

  function handleReset() {
    setKeyword('');
    setPropertyType('');
    setPriceIndex(0);
    setAreaIndex(0);
    router.push(basePath);
  }

  const hasFilters = !!(
    keyword ||
    propertyType ||
    pricePresets[priceIndex].min ||
    pricePresets[priceIndex].max ||
    AREA_PRESETS[areaIndex].min ||
    AREA_PRESETS[areaIndex].max
  );

  return (
    <form onSubmit={handleFilter} className="mb-6 rounded-2xl border bg-white p-4 shadow-sm">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Từ khoá */}
        <div className="lg:col-span-2">
          <input
            type="text"
            placeholder="Tìm theo tiêu đề, địa chỉ..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3.5 py-2 text-sm outline-none focus:border-brand-dark"
          />
        </div>

        {/* Loại BĐS */}
        <div>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
          >
            {PROPERTY_TYPES.map((t) => (
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
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
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
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-dark"
          >
            {AREA_PRESETS.map((a, idx) => (
              <option key={idx} value={idx}>
                {a.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-2 border-t pt-3">
        {hasFilters && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            Đặt lại bộ lọc
          </button>
        )}
        <button
          type="submit"
          className="rounded-xl bg-brand px-5 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-brand-dark"
        >
          Áp dụng lọc
        </button>
      </div>
    </form>
  );
}
