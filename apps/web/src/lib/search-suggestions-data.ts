/**
 * Dữ liệu gợi ý tìm kiếm tĩnh cho thanh search hero
 * Bao gồm: khu vực, quận/huyện, đường phố phổ biến, trường ĐH
 */

export interface SearchSuggestion {
  text: string;
  category: 'khu_vuc' | 'duong' | 'truong_dh';
  icon: string;
}

export const SEARCH_SUGGESTIONS: SearchSuggestion[] = [
  // === KHU VỰC / QUẬN / HUYỆN (TP.HCM) ===
  { text: 'Quận 1', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận 2 (Thủ Đức)', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận 3', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận 4', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận 5', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận 6', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận 7', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận 8', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận 9 (Thủ Đức)', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận 10', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận 11', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận 12', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Bình Thạnh', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Gò Vấp', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Tân Bình', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Tân Phú', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Phú Nhuận', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Bình Tân', category: 'khu_vuc', icon: '📍' },
  { text: 'TP Thủ Đức', category: 'khu_vuc', icon: '📍' },
  { text: 'Huyện Nhà Bè', category: 'khu_vuc', icon: '📍' },
  { text: 'Huyện Hóc Môn', category: 'khu_vuc', icon: '📍' },
  { text: 'Huyện Củ Chi', category: 'khu_vuc', icon: '📍' },
  { text: 'Huyện Bình Chánh', category: 'khu_vuc', icon: '📍' },

  // === KHU VỰC / QUẬN / HUYỆN (Hà Nội) ===
  { text: 'Quận Ba Đình, Hà Nội', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Hoàn Kiếm, Hà Nội', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Hai Bà Trưng, Hà Nội', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Đống Đa, Hà Nội', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Cầu Giấy, Hà Nội', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Thanh Xuân, Hà Nội', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Hoàng Mai, Hà Nội', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Long Biên, Hà Nội', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Nam Từ Liêm, Hà Nội', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Bắc Từ Liêm, Hà Nội', category: 'khu_vuc', icon: '📍' },
  { text: 'Quận Hà Đông, Hà Nội', category: 'khu_vuc', icon: '📍' },

  // === ĐƯỜNG PHỐ PHỔ BIẾN ===
  { text: 'Đại Cồ Việt, Hai Bà Trưng', category: 'duong', icon: '🛤️' },
  { text: 'Xuân Thủy, Cầu Giấy', category: 'duong', icon: '🛤️' },
  { text: 'Nguyễn Trãi, Thanh Xuân', category: 'duong', icon: '🛤️' },
  { text: 'Trần Đại Nghĩa, Hai Bà Trưng', category: 'duong', icon: '🛤️' },
  { text: 'Tạ Quang Bửu, Hai Bà Trưng', category: 'duong', icon: '🛤️' },
  { text: 'Phạm Ngọc Thạch, Quận 3', category: 'duong', icon: '🛤️' },
  { text: 'Nguyễn Văn Cừ, Quận 5', category: 'duong', icon: '🛤️' },
  { text: 'Điện Biên Phủ, Bình Thạnh', category: 'duong', icon: '🛤️' },
  { text: 'Võ Văn Ngân, Thủ Đức', category: 'duong', icon: '🛤️' },
  { text: 'Lê Văn Việt, Thủ Đức', category: 'duong', icon: '🛤️' },
  { text: 'Xa lộ Hà Nội, Thủ Đức', category: 'duong', icon: '🛤️' },
  { text: 'Cộng Hòa, Tân Bình', category: 'duong', icon: '🛤️' },
  { text: 'Hoàng Hoa Thám, Tân Bình', category: 'duong', icon: '🛤️' },
  { text: 'Phan Văn Trị, Gò Vấp', category: 'duong', icon: '🛤️' },
  { text: 'Quang Trung, Gò Vấp', category: 'duong', icon: '🛤️' },
  { text: 'Nguyễn Oanh, Gò Vấp', category: 'duong', icon: '🛤️' },
  { text: 'Trường Chinh, Quận 12', category: 'duong', icon: '🛤️' },
  { text: 'Lê Đức Thọ, Gò Vấp', category: 'duong', icon: '🛤️' },

  // === TRƯỜNG ĐẠI HỌC ===
  { text: 'Đại học Bách Khoa TPHCM', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Khoa Học Tự Nhiên TPHCM', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Sư Phạm TPHCM', category: 'truong_dh', icon: '🎓' },
  { text: 'ĐHQG TP.HCM', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Kinh Tế TPHCM (UEH)', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Ngoại Thương cơ sở 2 TPHCM', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Công Nghiệp TPHCM (IUH)', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Tôn Đức Thắng', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học FPT TPHCM', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Hutech', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Văn Lang', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Y Dược TPHCM', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Ngân Hàng TPHCM', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Bách Khoa Hà Nội', category: 'truong_dh', icon: '🎓' },
  { text: 'ĐHQG Hà Nội', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Kinh Tế Quốc Dân', category: 'truong_dh', icon: '🎓' },
  { text: 'Học viện Ngân Hàng', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Xây Dựng Hà Nội', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Thương Mại', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Ngoại Thương Hà Nội', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Sư Phạm Hà Nội', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Đà Nẵng', category: 'truong_dh', icon: '🎓' },
  { text: 'Đại học Cần Thơ', category: 'truong_dh', icon: '🎓' },
];

const CATEGORY_LABELS: Record<string, string> = {
  khu_vuc: 'Khu vực',
  duong: 'Đường phố',
  truong_dh: 'Trường Đại học',
};

/**
 * Tìm kiếm gợi ý theo keyword — fuzzy substring match
 * Trả về tối đa 8 kết quả, ưu tiên match từ đầu
 */
export function searchSuggestions(keyword: string): SearchSuggestion[] {
  const q = keyword.toLowerCase().trim();
  if (!q || q.length < 2) return [];

  // Ưu tiên: match từ đầu chuỗi > match substring
  const startsWithMatches: SearchSuggestion[] = [];
  const containsMatches: SearchSuggestion[] = [];

  for (const item of SEARCH_SUGGESTIONS) {
    const textLower = item.text.toLowerCase();
    // Bỏ dấu để hỗ trợ tìm kiếm không dấu
    const textNoDiacritics = removeDiacritics(textLower);
    const qNoDiacritics = removeDiacritics(q);

    if (textLower.includes(q) || textNoDiacritics.includes(qNoDiacritics)) {
      if (textLower.startsWith(q) || textNoDiacritics.startsWith(qNoDiacritics)) {
        startsWithMatches.push(item);
      } else {
        containsMatches.push(item);
      }
    }
  }

  return [...startsWithMatches, ...containsMatches].slice(0, 8);
}

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category] ?? category;
}

/** Bỏ dấu tiếng Việt để hỗ trợ tìm kiếm không dấu */
export function removeDiacritics(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}
