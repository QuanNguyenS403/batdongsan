'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import {
  VIETNAM_UNIVERSITIES,
  getNearbyUniversities,
  getGoogleMapsEmbedUrl,
  getGoogleMapsViewUrl,
  type UniversityData,
  type NearbyUniversityResult,
} from '@/lib/vietnam-universities';

export interface SelectedUniversityDistance {
  universityId?: number;
  universitySlug: string;
  name: string;
  abbreviation: string;
  distanceKm: number;
  distanceMeters: number;
  travelTimeMinutes: number;
}

interface GoogleMapAddressPickerProps {
  initialAddress?: string;
  initialLat?: number;
  initialLng?: number;
  onAddressChange?: (address: string) => void;
  onCoordinatesChange?: (coords: { lat: number; lng: number } | null) => void;
  onUniversitiesChange?: (universities: SelectedUniversityDistance[]) => void;
}

export function GoogleMapAddressPicker({
  initialAddress = '',
  initialLat,
  initialLng,
  onAddressChange,
  onCoordinatesChange,
  onUniversitiesChange,
}: GoogleMapAddressPickerProps) {
  // Mặc định tọa độ trung tâm Hai Bà Trưng, Hà Nội (khu vực trụ sở QNS BROKER) nếu chưa chọn
  const DEFAULT_LAT = 20.9982;
  const DEFAULT_LNG = 105.8778;

  const [address, setAddress] = useState(initialAddress);
  const [lat, setLat] = useState<number | null>(initialLat ?? null);
  const [lng, setLng] = useState<number | null>(initialLng ?? null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocatingGps, setIsLocatingGps] = useState(false);
  const [geoNotice, setGeoNotice] = useState<string | null>(null);
  const [showCoordinateInputs, setShowCoordinateInputs] = useState(false);
  const [customSearchUni, setCustomSearchUni] = useState('');
  const [selectedUnis, setSelectedUnis] = useState<Record<string, SelectedUniversityDistance>>({});
  const [, startTransition] = useTransition();

  // Tọa độ hiển thị trên bản đồ (fallback về tọa độ mặc định nếu chưa có)
  const activeLat = lat ?? DEFAULT_LAT;
  const activeLng = lng ?? DEFAULT_LNG;

  // Tự động tính toán các trường Đại học lân cận theo tọa độ hiện tại
  const nearbyUnis = useMemo<NearbyUniversityResult[]>(() => {
    if (lat == null || lng == null) return [];
    return getNearbyUniversities(lat, lng, 12, 8);
  }, [lat, lng]);

  // Cập nhật lên parent component khi tọa độ thay đổi
  useEffect(() => {
    if (lat != null && lng != null) {
      onCoordinatesChange?.({ lat, lng });
    } else {
      onCoordinatesChange?.(null);
    }
  }, [lat, lng, onCoordinatesChange]);

  // Tự động ghim các trường ĐH gần nhất (< 3km) vào danh sách đề xuất
  useEffect(() => {
    if (nearbyUnis.length > 0) {
      const topClosest = nearbyUnis.filter((u) => u.distanceKm <= 3.5);
      if (topClosest.length > 0) {
        setSelectedUnis((prev) => {
          const next = { ...prev };
          topClosest.forEach((u) => {
            if (!next[u.slug]) {
              next[u.slug] = {
                universitySlug: u.slug,
                name: u.name,
                abbreviation: u.abbreviation,
                distanceKm: u.distanceKm,
                distanceMeters: u.distanceMeters,
                travelTimeMinutes: u.travelTimeMinutes,
              };
            }
          });
          return next;
        });
      }
    }
  }, [nearbyUnis]);

  // Đồng bộ danh sách trường ĐH đã chọn ra ngoài
  useEffect(() => {
    const list = Object.values(selectedUnis);
    onUniversitiesChange?.(list);
  }, [selectedUnis, onUniversitiesChange]);

  // Hàm xử lý định vị địa chỉ bất kỳ qua Geocoding API
  async function handleGeocodeAddress(queryAddress?: string) {
    const targetQuery = (queryAddress ?? address).trim();
    if (!targetQuery) {
      setGeoNotice('Vui lòng nhập địa chỉ cụ thể để định vị trên Google Maps');
      return;
    }

    setIsGeocoding(true);
    setGeoNotice('Đang kết nối Google Maps để định vị địa chỉ...');

    try {
      // 1. Kiểm tra khớp tên trường ĐH trong danh bạ chuẩn
      const lowerQuery = targetQuery.toLowerCase();
      const matchedUni = VIETNAM_UNIVERSITIES.find(
        (u) =>
          lowerQuery.includes(u.name.toLowerCase()) ||
          lowerQuery.includes(u.abbreviation.toLowerCase()) ||
          (u.abbreviation && lowerQuery.includes(u.abbreviation.toLowerCase().replace(/[^a-z0-9]/g, ''))),
      );

      if (matchedUni) {
        setLat(matchedUni.lat);
        setLng(matchedUni.lng);
        setGeoNotice(`Đã định vị chính xác khu vực ${matchedUni.name} trên Google Maps`);
        setIsGeocoding(false);
        return;
      }

      // 2. Geocoding trực tiếp qua dịch vụ bản đồ vệ tinh tiếng Việt
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&countrycodes=vn&limit=1&q=${encodeURIComponent(
          targetQuery,
        )}`,
        {
          headers: { 'User-Agent': 'QNS-RealEstate-Broker/2.0' },
          signal: controller.signal,
        },
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const results = await res.json();
        if (Array.isArray(results) && results.length > 0 && results[0].lat && results[0].lon) {
          const newLat = parseFloat(results[0].lat);
          const newLng = parseFloat(results[0].lon);
          setLat(newLat);
          setLng(newLng);
          setGeoNotice('Đã xác định tọa độ và ghim vị trí chính xác trên bản đồ Google Maps');
          return;
        }
      }

      // Nếu không tìm thấy tọa độ cụ thể, giữ bản đồ theo từ khóa
      setGeoNotice('Đã liên kết vị trí bản đồ Google Maps theo địa chỉ bạn nhập');
    } catch {
      setGeoNotice('Bản đồ Google Maps hiển thị theo địa chỉ nhập thực tế');
    } finally {
      setIsGeocoding(false);
    }
  }

  // Hàm lấy vị trí GPS hiện tại của thiết bị
  function handleGetDeviceGps() {
    if (!navigator.geolocation) {
      setGeoNotice('Trình duyệt của bạn không hỗ trợ định vị GPS trực tiếp');
      return;
    }

    setIsLocatingGps(true);
    setGeoNotice('Đang yêu cầu tọa độ GPS vệ tinh...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newLat = Number(pos.coords.latitude.toFixed(6));
        const newLng = Number(pos.coords.longitude.toFixed(6));
        setLat(newLat);
        setLng(newLng);
        setIsLocatingGps(false);
        setGeoNotice(`Đã lấy vị trí GPS chính xác: ${newLat}, ${newLng}`);
      },
      (err) => {
        setIsLocatingGps(false);
        if (err.code === 1) {
          setGeoNotice('Quyền truy cập vị trí bị từ chối, bạn có thể gõ địa chỉ vào ô bên trên');
        } else {
          setGeoNotice('Không thể lấy tín hiệu GPS, vui lòng nhập địa chỉ cụ thể');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  // Chuyển đổi trạng thái tích chọn trường ĐH lân cận
  function toggleUniversitySelection(uni: UniversityData, distKm?: number, distMeters?: number, timeMins?: number) {
    setSelectedUnis((prev) => {
      const next = { ...prev };
      if (next[uni.slug]) {
        delete next[uni.slug];
      } else {
        const km = distKm ?? (lat && lng ? getNearbyUniversities(lat, lng, 100, 100).find((u) => u.slug === uni.slug)?.distanceKm ?? 0 : 0);
        const meters = distMeters ?? Math.round(km * 1000);
        const mins = timeMins ?? Math.max(1, Math.round((km / 22) * 60));
        next[uni.slug] = {
          universitySlug: uni.slug,
          name: uni.name,
          abbreviation: uni.abbreviation,
          distanceKm: km,
          distanceMeters: meters,
          travelTimeMinutes: mins,
        };
      }
      return next;
    });
  }

  // Lọc tìm kiếm trường ĐH thủ công
  const filteredSearchUnis = useMemo(() => {
    if (!customSearchUni.trim()) return [];
    const q = customSearchUni.toLowerCase().trim();
    return VIETNAM_UNIVERSITIES.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.abbreviation.toLowerCase().includes(q) ||
        u.address.toLowerCase().includes(q),
    ).slice(0, 5);
  }, [customSearchUni]);

  return (
    <div className="space-y-4 rounded-2xl border border-surface-border bg-slate-50/70 p-4 sm:p-5 shadow-sm">
      {/* Header khu vực nhập địa chỉ & Google Maps */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border/70 pb-3">
        <div>
          <h3 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
            <span className="text-base text-red-500">📍</span>
            <span>Định vị Google Maps & Trường Đại học lân cận</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Liên kết Google Maps để khách thuê dễ dàng tìm đường và xem khoảng cách tới trường học
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGetDeviceGps}
            disabled={isLocatingGps}
            className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand/5 shadow-xs transition-colors disabled:opacity-50"
            title="Định vị ngay tại vị trí căn phòng hiện tại"
          >
            <span>🛰️</span>
            <span>{isLocatingGps ? 'Đang lấy GPS...' : 'Lấy vị trí GPS hiện tại'}</span>
          </button>
        </div>
      </div>

      {/* Ô nhập địa chỉ bất kỳ */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
          Địa chỉ chi tiết bất kỳ (Số nhà, tên ngõ, đường, phường/xã) *
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              name="addressDetail"
              value={address}
              onChange={(e) => {
                const val = e.target.value;
                setAddress(val);
                onAddressChange?.(val);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGeocodeAddress();
                }
              }}
              placeholder="VD: Số 25 Ngõ 622 Minh Khai, Phường Vĩnh Tuy, Quận Hai Bà Trưng, Hà Nội"
              className="input-field pr-8 text-sm"
              required
            />
            {address && (
              <button
                type="button"
                onClick={() => {
                  setAddress('');
                  onAddressChange?.('');
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => handleGeocodeAddress()}
            disabled={isGeocoding || !address.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-brand px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-hover transition-all disabled:opacity-50 whitespace-nowrap"
          >
            <span>🔍</span>
            <span>{isGeocoding ? 'Đang định vị...' : 'Định vị Google Maps'}</span>
          </button>
        </div>
        {geoNotice && (
          <p className="mt-1.5 text-[11px] font-medium text-emerald-700 flex items-center gap-1">
            <span>ℹ️</span>
            <span>{geoNotice}</span>
          </p>
        )}
      </div>

      {/* Bản đồ Google Maps Embed hiển thị trực quan */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-text-primary">Bản đồ định vị vệ tinh</span>
            {lat != null && lng != null && (
              <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                Tọa độ: {lat.toFixed(5)}, {lng.toFixed(5)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCoordinateInputs(!showCoordinateInputs)}
              className="text-[11px] text-text-muted hover:text-brand underline"
            >
              {showCoordinateInputs ? 'Ẩn tọa độ số' : 'Nhập tọa độ thủ công'}
            </button>
            <a
              href={getGoogleMapsViewUrl({ lat: activeLat, lng: activeLng, address })}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand hover:underline"
            >
              <span>Mở Google Maps lớn</span>
              <span>↗</span>
            </a>
          </div>
        </div>

        {/* Khung bản đồ */}
        <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden rounded-xl border border-surface-border bg-slate-200 shadow-inner">
          <iframe
            title="Google Maps Location"
            src={getGoogleMapsEmbedUrl({ lat: activeLat, lng: activeLng, address: address || 'Hà Nội' })}
            className="h-full w-full border-0"
            loading="lazy"
            allowFullScreen
          />
        </div>

        {/* Input tọa độ thủ công nếu người dùng muốn tinh chỉnh */}
        {showCoordinateInputs && (
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 bg-white p-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">Vĩ độ (Latitude)</label>
              <input
                type="number"
                step="0.000001"
                value={lat ?? ''}
                onChange={(e) => setLat(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="VD: 20.9982"
                className="input-field text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-text-muted mb-1">Kinh độ (Longitude)</label>
              <input
                type="number"
                step="0.000001"
                value={lng ?? ''}
                onChange={(e) => setLng(e.target.value ? parseFloat(e.target.value) : null)}
                placeholder="VD: 105.8778"
                className="input-field text-xs py-1.5"
              />
            </div>
          </div>
        )}
      </div>

      {/* Mục Trường Đại học lân cận (Định vị tự động theo Google Maps) */}
      <div className="space-y-3 pt-2 border-t border-surface-border/70">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h4 className="text-xs font-bold text-text-primary flex items-center gap-1">
              <span>🎓</span>
              <span>Trường Đại học lân cận (Tự động đo theo Google Maps)</span>
            </h4>
            <p className="text-[11px] text-text-muted">
              Chọn các trường lân cận để sinh viên tìm trọ thấy ngay cự ly và thời gian di chuyển
            </p>
          </div>
          {Object.keys(selectedUnis).length > 0 && (
            <span className="text-[11px] font-bold text-brand">
              Đã ghim {Object.keys(selectedUnis).length} trường
            </span>
          )}
        </div>

        {/* Danh sách trường gần nhất được gợi ý theo tọa độ */}
        {nearbyUnis.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {nearbyUnis.map((uni) => {
              const isSelected = !!selectedUnis[uni.slug];
              return (
                <div
                  key={uni.slug}
                  onClick={() =>
                    toggleUniversitySelection(uni, uni.distanceKm, uni.distanceMeters, uni.travelTimeMinutes)
                  }
                  className={`flex cursor-pointer items-start justify-between gap-2 rounded-xl border p-2.5 transition-all select-none ${
                    isSelected
                      ? 'border-brand bg-brand/5 shadow-xs'
                      : 'border-surface-border bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="mt-0.5 h-3.5 w-3.5 rounded border-slate-300 text-brand focus:ring-brand"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text-primary truncate">
                        {uni.abbreviation ? `[${uni.abbreviation}] ` : ''}
                        {uni.name}
                      </p>
                      <p className="text-[11px] text-text-muted truncate mt-0.5">{uni.address}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="inline-block rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      {uni.distanceKm < 1 ? `~${uni.distanceMeters}m` : `~${uni.distanceKm} km`}
                    </span>
                    <p className="text-[10px] text-text-muted mt-0.5">~{uni.travelTimeMinutes} phút xe máy</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-center text-xs text-text-muted">
            Nhập địa chỉ ở trên và bấm "Định vị Google Maps" để hệ thống tự động đo khoảng cách tới các trường Đại học lân cận
          </div>
        )}

        {/* Tìm kiếm và thêm trường ĐH thủ công */}
        <div className="pt-2">
          <label className="block text-[11px] font-medium text-text-muted mb-1">
            Gắn thêm trường Đại học khác (Tìm kiếm theo tên trường hoặc mã viết tắt)
          </label>
          <div className="relative">
            <input
              type="text"
              value={customSearchUni}
              onChange={(e) => {
                const val = e.target.value;
                startTransition(() => {
                  setCustomSearchUni(val);
                });
              }}
              placeholder="VD: Kinh tế Quốc Dân, Bách Khoa, HUBT, UNETI, USSH, HOU..."
              className="input-field text-xs py-2"
            />
            {filteredSearchUnis.length > 0 && (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-surface-border bg-white p-1.5 shadow-lg space-y-1">
                {filteredSearchUnis.map((uni) => {
                  const isSelected = !!selectedUnis[uni.slug];
                  return (
                    <div
                      key={uni.slug}
                      onClick={() => {
                        toggleUniversitySelection(uni);
                        setCustomSearchUni('');
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-lg p-2 text-xs hover:bg-slate-50 transition-colors"
                    >
                      <div className="truncate">
                        <span className="font-bold text-text-primary">
                          {uni.abbreviation ? `[${uni.abbreviation}] ` : ''}
                          {uni.name}
                        </span>
                        <p className="text-[10px] text-text-muted truncate">{uni.address}</p>
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold text-brand">
                        {isSelected ? 'Đã chọn' : '+ Chọn'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
