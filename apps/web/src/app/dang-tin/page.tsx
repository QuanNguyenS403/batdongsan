'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { authFetch, isLoggedIn } from '@/lib/auth-client';

interface LocationItem {
  id: number;
  name: string;
  level: string;
  slug: string;
  parentId: number | null;
}

interface UniversityItem {
  id: number;
  name: string;
  shortName?: string | null;
  abbreviation?: string | null;
  slug: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

const PROPERTY_TYPES = [
  { value: 'phong-tro-sinh-vien', label: '🛏️ Phòng trọ sinh viên' },
  { value: 'phong-tro-nguoi-di-lam', label: '💼 Phòng trọ người đi làm' },
  { value: 'ky-tuc-xa-tu-nhan', label: '📦 Ký túc xá tư nhân / Sleepbox' },
  { value: 'studio', label: '🛋️ Căn hộ Studio' },
  { value: 'can-ho-chung-cu', label: '🏢 Căn hộ chung cư' },
  { value: 'nha-nguyen-can', label: '🏡 Nhà nguyên căn' },
  { value: 'mat-bang-kinh-doanh', label: '🏪 Mặt bằng kinh doanh / Cửa hàng' },
];

const AMENITY_OPTIONS = [
  { key: 'wifi', label: 'Wifi internet', icon: '📶' },
  { key: 'air_conditioner', label: 'Máy lạnh / Điều hòa', icon: '❄️' },
  { key: 'mezzanine', label: 'Gác lửng', icon: '🪜' },
  { key: 'parking', label: 'Nhà để xe', icon: '🛵' },
  { key: 'security_camera', label: 'Camera / An ninh 24/7', icon: '📹' },
  { key: 'free_time', label: 'Giờ giấc tự do 24/24', icon: '🔑' },
  { key: 'private_bathroom', label: 'Vệ sinh khép kín', icon: '🚿' },
  { key: 'water_heater', label: 'Bình nóng lạnh', icon: '♨️' },
  { key: 'washing_machine', label: 'Máy giặt', icon: '🧺' },
  { key: 'refrigerator', label: 'Tủ lạnh', icon: '🧊' },
  { key: 'kitchen', label: 'Kệ bếp nấu ăn', icon: '🍳' },
  { key: 'elevator', label: 'Thang máy', icon: '🛗' },
  { key: 'balcony', label: 'Ban công / Cửa sổ thoáng', icon: '🪟' },
  { key: 'fingerprint_lock', label: 'Khóa vân tay', icon: '🔒' },
];

export default function DangTinPage() {
  const [locations, setLocations] = useState<LocationItem[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [propertyType, setPropertyType] = useState('phong-tro-sinh-vien');
  const [utilitiesIncluded, setUtilitiesIncluded] = useState(false);
  const [waterPricingType, setWaterPricingType] = useState<'m3' | 'flat'>('m3');
  const [selectedAmenities, setSelectedAmenities] = useState<Record<string, boolean>>({
    wifi: true,
    parking: true,
  });
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [universityDistanceKm, setUniversityDistanceKm] = useState<string>('');

  // Quản lý hình ảnh và xem trước
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setSelectedFiles((prev) => [...prev, ...files]);
    const newUrls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls((prev) => [...prev, ...newUrls]);
  }

  function handleRemoveFile(index: number) {
    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
    }
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  }

  useEffect(() => {
    // Tải danh sách địa danh
    fetch(`${API_URL}/locations`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setLocations(data))
      .catch(() => setLocations([]));

    // Tải danh sách các trường đại học
    fetch(`${API_URL}/universities`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setUniversities(data))
      .catch(() => setUniversities([]));
  }, []);

  function toggleAmenity(key: string) {
    setSelectedAmenities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setUploadStatus(null);

    if (!isLoggedIn()) {
      setError('Vui lòng đăng nhập trước khi đăng tin.');
      return;
    }

    const form = new FormData(e.currentTarget);
    const locationIdValue = form.get('locationId');
    if (!locationIdValue) {
      setError('Vui lòng chọn khu vực phòng cho thuê.');
      return;
    }

    // Tiện ích đã chọn
    const activeAmenities: Record<string, boolean> = {};
    Object.entries(selectedAmenities).forEach(([k, v]) => {
      if (v) activeAmenities[k] = true;
    });

    // Thông tin trường gần đó nếu có
    const universityDistances =
      selectedUniversityId && Number(selectedUniversityId) > 0
        ? [
            {
              universityId: Number(selectedUniversityId),
              distanceMeters: universityDistanceKm ? Math.round(Number(universityDistanceKm) * 1000) : undefined,
              travelTimeMinutes: universityDistanceKm ? Math.round(Number(universityDistanceKm) * 3) : undefined,
            },
          ]
        : undefined;

    const payload = {
      transactionType: 'rent',
      propertyType,
      locationId: Number(locationIdValue),
      title: form.get('title'),
      description: form.get('description'),
      price: Number(form.get('price')),
      depositAmount: form.get('depositAmount') ? Number(form.get('depositAmount')) : undefined,
      minLeaseMonths: form.get('minLeaseMonths') ? Number(form.get('minLeaseMonths')) : undefined,
      utilitiesIncluded,
      electricityPricePerKwh: !utilitiesIncluded && form.get('electricityPricePerKwh') ? Number(form.get('electricityPricePerKwh')) : undefined,
      waterPricePerM3:
        !utilitiesIncluded && waterPricingType === 'm3' && form.get('waterPricePerM3')
          ? Number(form.get('waterPricePerM3'))
          : undefined,
      waterPriceFlat:
        !utilitiesIncluded && waterPricingType === 'flat' && form.get('waterPriceFlat')
          ? Number(form.get('waterPriceFlat'))
          : undefined,
      amenities: activeAmenities,
      areaM2: Number(form.get('areaM2')),
      bedrooms: form.get('bedrooms') ? Number(form.get('bedrooms')) : undefined,
      bathrooms: form.get('bathrooms') ? Number(form.get('bathrooms')) : undefined,
      legalStatus: form.get('legalStatus') || undefined,
      addressDetail: form.get('addressDetail') || undefined,
      universityDistances,
    };

    const validImageFiles = selectedFiles.filter((f) => f && f.size > 0);

    setLoading(true);
    try {
      // 1. Tạo tin đăng
      const res = await authFetch('/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        return;
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message?.toString() ?? 'Đăng tin thất bại.');

      // 2. Upload ảnh đính kèm nếu có
      if (validImageFiles.length > 0) {
        setUploadStatus(`Đang tải lên ${validImageFiles.length} hình ảnh...`);
        const imgFormData = new FormData();
        validImageFiles.forEach((file) => {
          imgFormData.append('files', file);
        });

        const imgRes = await authFetch(`/listings/${data.id}/images`, {
          method: 'POST',
          body: imgFormData,
        });

        if (!imgRes.ok) {
          const imgErr = await imgRes.json();
          setUploadStatus(`Tin đã tạo nhưng không upload được ảnh: ${imgErr.message ?? 'Lỗi không xác định'}`);
        } else {
          setUploadStatus(`Đã tải lên thành công ${validImageFiles.length} ảnh.`);
        }
      }

      setMessage('success');
      setSelectedFiles([]);
      setPreviewUrls([]);
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand mb-2">
          🔑 Nền tảng chuyên biệt cho thuê
        </span>
        <h1 className="text-2xl font-bold text-text-primary">Đăng tin cho thuê phòng / Căn hộ</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Tiếp cận hàng chục ngàn sinh viên & người đi thuê mỗi tháng. Tin đăng được kiểm duyệt nhanh chóng trong vòng 1-2 giờ.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-surface-border bg-white p-7 shadow-elevated">
        {/* Loại hình cho thuê */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Loại hình phòng cho thuê *</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PROPERTY_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                onClick={() => setPropertyType(pt.value)}
                className={`flex items-center gap-2 p-3 text-left rounded-xl border text-sm font-medium transition-colors ${
                  propertyType === pt.value
                    ? 'border-brand bg-brand/5 text-brand font-semibold ring-1 ring-brand'
                    : 'border-surface-border bg-white text-text-secondary hover:border-brand/40'
                }`}
              >
                <span>{pt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Địa danh & Khu vực */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Khu vực (Tỉnh/Quận/Huyện) *</label>
            <select name="locationId" required className="input-field">
              <option value="">-- Chọn khu vực --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.level === 'province' ? `📍 ${loc.name}` : loc.level === 'district' ? `  └─ ${loc.name}` : `     └─ ${loc.name}`}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Địa chỉ cụ thể (Số nhà, ngõ, tên đường)</label>
            <input
              name="addressDetail"
              placeholder="VD: Số 45/12 đường D1, KDC Him Lam"
              className="input-field"
            />
          </div>
        </div>

        {/* Tiêu đề & Mô tả */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Tiêu đề tin đăng *</label>
          <input
            name="title"
            required
            minLength={10}
            placeholder="VD: Phòng trọ cao cấp có gác lửng đúc, ban công thoáng, gần ĐH Tôn Đức Thắng"
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Mô tả chi tiết căn phòng</label>
          <textarea
            name="description"
            placeholder="Mô tả về phòng, đồ đạc có sẵn, lối đi riêng, giờ giấc, an ninh, tiện ích xung quanh (chợ, siêu thị, bến xe buýt)..."
            rows={4}
            className="input-field resize-y"
          />
        </div>

        {/* Giá thuê & Thông số */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Giá thuê / tháng (VNĐ) *</label>
            <input
              name="price"
              required
              type="number"
              placeholder="VD: 3200000"
              className="input-field"
            />
            <p className="mt-1 text-[11px] text-text-muted">Nhập VNĐ — VD: 3200000 = 3.2 triệu/tháng</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Tiền đặt cọc (VNĐ)</label>
            <input
              name="depositAmount"
              type="number"
              placeholder="VD: 3200000"
              className="input-field"
            />
            <p className="mt-1 text-[11px] text-text-muted">Thường bằng 1 tháng tiền phòng</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Hợp đồng tối thiểu (tháng)</label>
            <input
              name="minLeaseMonths"
              type="number"
              placeholder="VD: 6 hoặc 12"
              className="input-field"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Diện tích sử dụng (m²) *</label>
            <input
              name="areaM2"
              required
              type="number"
              step="0.1"
              placeholder="VD: 25.5"
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Số phòng ngủ</label>
            <input
              name="bedrooms"
              type="number"
              placeholder="VD: 1"
              defaultValue={1}
              className="input-field"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Số phòng tắm / WC</label>
            <input
              name="bathrooms"
              type="number"
              placeholder="VD: 1"
              defaultValue={1}
              className="input-field"
            />
          </div>
        </div>

        {/* Minh bạch chi phí điện nước (CỐT LÕI) */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={utilitiesIncluded}
                onChange={(e) => setUtilitiesIncluded(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand focus:ring-brand"
              />
              <span className="text-sm font-bold text-text-primary">⚡ Miễn phí / Bao trọn tiền điện nước trong giá thuê</span>
            </label>
          </div>

          {!utilitiesIncluded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-emerald-200/60">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-text-secondary">Giá điện (VNĐ/kWh)</label>
                <input
                  name="electricityPricePerKwh"
                  type="number"
                  placeholder="VD: 3500 hoặc 4000"
                  className="input-field bg-white"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-text-secondary">Hình thức tính tiền nước</label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setWaterPricingType('m3')}
                      className={`px-2 py-0.5 rounded ${waterPricingType === 'm3' ? 'bg-brand text-white font-medium' : 'text-text-muted'}`}
                    >
                      Theo khối (m³)
                    </button>
                    <button
                      type="button"
                      onClick={() => setWaterPricingType('flat')}
                      className={`px-2 py-0.5 rounded ${waterPricingType === 'flat' ? 'bg-brand text-white font-medium' : 'text-text-muted'}`}
                    >
                      Khoán / người
                    </button>
                  </div>
                </div>

                {waterPricingType === 'm3' ? (
                  <input
                    name="waterPricePerM3"
                    type="number"
                    placeholder="VD: 20000 (đ/m³)"
                    className="input-field bg-white"
                  />
                ) : (
                  <input
                    name="waterPriceFlat"
                    type="number"
                    placeholder="VD: 100000 (đ/người/tháng)"
                    className="input-field bg-white"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Tiện ích & Cơ sở vật chất */}
        <div>
          <label className="mb-2 block text-xs font-semibold text-text-secondary">Tiện ích phòng có sẵn</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {AMENITY_OPTIONS.map((item) => {
              const isChecked = !!selectedAmenities[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => toggleAmenity(item.key)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium text-left transition-colors ${
                    isChecked
                      ? 'border-brand bg-brand/10 text-brand font-semibold'
                      : 'border-surface-border bg-slate-50/50 text-text-secondary hover:border-slate-300'
                  }`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Gần trường đại học */}
        <div className="rounded-xl border border-surface-border bg-surface-muted/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-base">🎓</span>
            <label className="text-xs font-semibold text-text-secondary">Gần trường Đại học nào? (Thu hút sinh viên tìm kiếm)</label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              value={selectedUniversityId}
              onChange={(e) => setSelectedUniversityId(e.target.value)}
              className="input-field bg-white"
            >
              <option value="">-- Chọn trường ĐH gần nhất --</option>
              {universities.map((uni) => (
                <option key={uni.id} value={uni.id}>
                  {uni.abbreviation ? `[${uni.abbreviation}] ` : ''}{uni.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.1"
              value={universityDistanceKm}
              onChange={(e) => setUniversityDistanceKm(e.target.value)}
              placeholder="Khoảng cách ước tính (VD: 0.8 km)"
              className="input-field bg-white"
            />
          </div>
        </div>

        {/* Upload hình ảnh */}
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
            Hình ảnh thực tế phòng trọ (Tối đa 20 ảnh, JPG/PNG/WEBP, tối đa 10MB/ảnh)
          </label>
          <input
            name="images"
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="w-full rounded-xl border border-dashed border-surface-border bg-slate-50/60 p-3 text-sm text-text-secondary file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-700 transition-colors"
          />
          <p className="mt-1 text-[11px] text-text-muted">
            💡 Mẹo: Phòng có hình ảnh rõ ràng, chụp từ nhiều góc và có ảnh nhà vệ sinh sẽ có tỷ lệ liên hệ cao gấp 3 lần.
          </p>

          {/* Thumbnail preview */}
          {previewUrls.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-text-secondary mb-2">
                Đã chọn {previewUrls.length} ảnh xem trước:
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
                {previewUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-surface-border aspect-square bg-slate-100 shadow-sm">
                    <img src={url} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs transition-colors shadow"
                      title="Xóa ảnh này"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-base"
        >
          {loading ? 'Đang gửi thông tin...' : 'Đăng tin phòng trọ ngay'}
        </button>

        {uploadStatus && <p className="text-xs text-brand font-medium">{uploadStatus}</p>}

        {message === 'success' && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <p className="font-semibold">✓ Đăng tin thành công!</p>
            <p className="mt-1 text-xs leading-relaxed">
              Tin phòng của bạn đang ở trạng thái <b>chờ duyệt</b>. Đội ngũ kiểm duyệt sẽ xử lý trong vòng 1-2 giờ. Bạn có thể theo dõi trạng thái tại{' '}
              <Link href="/tai-khoan/quan-ly-tin" className="font-bold underline text-brand-700">
                trang Quản lý tin
              </Link>
              .
            </p>
          </div>
        )}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </form>
    </div>
  );
}
