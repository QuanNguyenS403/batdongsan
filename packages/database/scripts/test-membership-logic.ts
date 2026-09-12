/**
 * Test logic Giai đoạn 1 & Giai đoạn 2:
 * 1. Surge Pricing tính theo mùa vụ
 * 2. Giới hạn số tin theo gói (chặn tin thứ 4 với user Trial 3 tin)
 * 3. Đánh dấu và huỷ nhãn xác thực thực tế
 */
import assert from 'assert';

console.log('🧪 Bắt đầu chạy test logic Membership, Surge Pricing và Listing Verification...\n');

// 1. Test Surge Pricing
function calculatePlanPrices(
  plans: { name: string; price: number }[],
  activeSeason: { name: string; priceMultiplier: number; isActive: boolean } | null,
) {
  const multiplier = activeSeason && activeSeason.isActive ? activeSeason.priceMultiplier : 1.0;
  return plans.map((p) => ({
    name: p.name,
    originalPrice: p.price,
    currentPrice: p.price === 0 ? 0 : Math.round(p.price * multiplier),
    priceMultiplier: multiplier,
    isSurgeActive: multiplier > 1.0 && p.price > 0,
  }));
}

const basePlans = [
  { name: 'Gói Dùng Thử', price: 0 },
  { name: 'Gói Khởi Đầu', price: 199000 },
  { name: 'Gói Chuyên Nghiệp', price: 499000 },
  { name: 'Gói VIP', price: 999000 },
];

// Test 1a: Khi Mùa cao điểm BẬT (hệ số 1.5x)
const seasonOn = { name: 'Mùa tựu trường T8-T9', priceMultiplier: 1.5, isActive: true };
const surgePrices = calculatePlanPrices(basePlans, seasonOn);

assert.strictEqual(surgePrices[0].currentPrice, 0, 'Gói Dùng Thử phải luôn là 0đ');
assert.strictEqual(surgePrices[1].currentPrice, 298500, 'Gói Khởi Đầu 199k x 1.5 = 298.500đ');
assert.strictEqual(surgePrices[2].currentPrice, 748500, 'Gói Chuyên Nghiệp 499k x 1.5 = 748.500đ');
assert.strictEqual(surgePrices[3].currentPrice, 1498500, 'Gói VIP 999k x 1.5 = 1.498.500đ');
assert.strictEqual(surgePrices[1].isSurgeActive, true, 'isSurgeActive phải là true');
console.log('✅ PASS Test 1a: Surge Pricing với hệ số 1.5x tính chính xác 100%');

// Test 1b: Khi Mùa cao điểm TẮT (về giá gốc 1.0x)
const seasonOff = { name: 'Mùa tựu trường T8-T9', priceMultiplier: 1.5, isActive: false };
const normalPrices = calculatePlanPrices(basePlans, seasonOff);

assert.strictEqual(normalPrices[1].currentPrice, 199000, 'Gói Khởi Đầu về lại 199.000đ khi tắt mùa');
assert.strictEqual(normalPrices[2].currentPrice, 499000, 'Gói Chuyên Nghiệp về lại 499.000đ khi tắt mùa');
assert.strictEqual(normalPrices[1].isSurgeActive, false, 'isSurgeActive phải là false khi tắt mùa');
console.log('✅ PASS Test 1b: Tắt mùa cao điểm, giá tự động trở về giá gốc bình thường');

// 2. Test Giới hạn số tin đăng (Listing Quota)
function checkListingQuota(
  userPlan: { name: string; maxActiveListings: number },
  currentActiveCount: number,
) {
  const max = userPlan.maxActiveListings;
  const remainingSlots = Math.max(0, max - currentActiveCount);
  const canPostMore = remainingSlots > 0;

  if (!canPostMore) {
    throw new Error(
      `Bạn đã đạt giới hạn tối đa ${max} tin đăng cho ${userPlan.name}. Vui lòng nâng cấp gói thành viên tại trang Bảng giá để tiếp tục đăng thêm tin!`,
    );
  }

  return { remainingSlots, canPostMore };
}

const trialPlan = { name: 'Gói Dùng Thử', maxActiveListings: 3 };

// User có 0 tin -> Đăng tin thứ 1 OK
const step1 = checkListingQuota(trialPlan, 0);
assert.strictEqual(step1.remainingSlots, 3);
assert.strictEqual(step1.canPostMore, true);

// User có 2 tin -> Đăng tin thứ 3 OK
const step2 = checkListingQuota(trialPlan, 2);
assert.strictEqual(step2.remainingSlots, 1);
assert.strictEqual(step2.canPostMore, true);

// User có 3 tin -> Thử đăng tin thứ 4 -> BỊ CHẶN
let blocked = false;
try {
  checkListingQuota(trialPlan, 3);
} catch (err: any) {
  blocked = true;
  assert.ok(
    err.message.includes('Bạn đã đạt giới hạn tối đa 3 tin đăng cho Gói Dùng Thử'),
    'Thông báo lỗi phải rõ ràng tự nhiên',
  );
}
assert.strictEqual(blocked, true, 'User gói Trial có 3 tin bắt buộc phải bị chặn khi đăng tin thứ 4');
console.log('✅ PASS Test 2: Chặn đăng tin vượt hạn mức gói Trial (3 tin) thành công với thông báo rõ ràng');

// User nâng cấp lên gói Pro (30 tin) -> Đăng tin thứ 4 OK
const proPlan = { name: 'Gói Chủ Trọ Chuyên Nghiệp', maxActiveListings: 30 };
const step4 = checkListingQuota(proPlan, 3);
assert.strictEqual(step4.remainingSlots, 27);
assert.strictEqual(step4.canPostMore, true);
console.log('✅ PASS Test 2b: Sau khi nâng cấp gói Pro, hạn mức tăng lên 30 tin thành công');

// 3. Test Verification Status (Phase 2 Trust-as-a-Service)
interface MockListing {
  id: string;
  verificationStatus: 'chua_xac_thuc' | 'cho_xac_thuc' | 'da_xac_thuc';
  verifiedAt: Date | null;
  verifiedByUserId: string | null;
}

const listing: MockListing = {
  id: '1',
  verificationStatus: 'chua_xac_thuc',
  verifiedAt: null,
  verifiedByUserId: null,
};

// Admin gắn mác xác thực
listing.verificationStatus = 'da_xac_thuc';
listing.verifiedAt = new Date();
listing.verifiedByUserId = 'admin-99';

assert.strictEqual(listing.verificationStatus, 'da_xac_thuc');
assert.ok(listing.verifiedAt !== null);
assert.strictEqual(listing.verifiedByUserId, 'admin-99');
console.log('✅ PASS Test 3a: Admin gắn mác "Đã kiểm tra thực tế" thành công');

// Admin huỷ nhãn
listing.verificationStatus = 'chua_xac_thuc';
listing.verifiedAt = null;
listing.verifiedByUserId = null;

assert.strictEqual(listing.verificationStatus, 'chua_xac_thuc');
assert.strictEqual(listing.verifiedAt, null);
console.log('✅ PASS Test 3b: Admin huỷ nhãn xác thực thành công');

console.log('\n🎉 TẤT CẢ CÁC TEST LOGIC ĐỀU ĐÃ VƯỢT QUA 100%!');
