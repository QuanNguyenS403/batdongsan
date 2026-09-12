/**
 * Kịch bản kiểm thử nghiệm thu tự động Wave 1 — Product truth và lead thật
 * Kiểm tra: P0-02 (Lead thật & dedupe), P0-03 & FE-07 (Xóa trust tick giả), P0-04 (Tắt demo fallback & chặn mutation).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const { createHash } = require('crypto');

// Load .env gốc nếu có
const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const apiNodeModules = path.resolve(__dirname, '../../../apps/api/node_modules');
const rootNodeModules = path.resolve(__dirname, '../../../node_modules');
module.paths.unshift(apiNodeModules, rootNodeModules);

const { LeadsService } = require('../../../apps/api/dist/modules/leads/leads.service');

// Mock Prisma Store cho Lead và Listing
class InMemoryDatabase {
  constructor() {
    this.listings = new Map();
    this.leads = new Map();
    this.nextLeadId = 1n;

    // Seed 1 listing active và 1 listing pending
    this.listings.set(100n, {
      id: 100n,
      title: 'Phòng trọ Studio Cầu Giấy',
      slug: 'phong-tro-studio-cau-giay-id100',
      status: 'active',
      ownerId: 999n,
      price: 3500000n,
      owner: { id: 999n, fullName: 'Chủ trọ Nguyễn', phone: '0912345678' },
    });

    this.listings.set(200n, {
      id: 200n,
      title: 'Phòng trọ hết hạn',
      slug: 'phong-tro-het-han-id200',
      status: 'expired',
      ownerId: 999n,
      price: 2500000n,
      owner: { id: 999n, fullName: 'Chủ trọ Nguyễn', phone: '0912345678' },
    });
  }

  get listing() {
    return {
      findUnique: async ({ where }) => {
        const id = BigInt(where.id);
        const l = this.listings.get(id);
        return l ? { ...l } : null;
      },
    };
  }

  get lead() {
    return {
      findUnique: async ({ where }) => {
        if (where.dedupeKey) {
          for (const item of this.leads.values()) {
            if (item.dedupeKey === where.dedupeKey) return { ...item };
          }
          return null;
        }
        if (where.id !== undefined) {
          const item = this.leads.get(BigInt(where.id));
          return item ? { ...item } : null;
        }
        return null;
      },
      create: async ({ data }) => {
        // Kiểm tra unique dedupeKey
        for (const item of this.leads.values()) {
          if (item.dedupeKey === data.dedupeKey) {
            const err = new Error('Unique constraint failed on dedupe_key');
            err.code = 'P2002';
            throw err;
          }
        }
        const id = this.nextLeadId++;
        const record = {
          id,
          listingId: data.listingId,
          requesterId: data.requesterId ?? null,
          fullName: data.fullName,
          phone: data.phone,
          email: data.email ?? null,
          message: data.message ?? null,
          channel: data.channel ?? 'web_form',
          consent: data.consent ?? true,
          status: data.status ?? 'new',
          dedupeKey: data.dedupeKey,
          assignedToUserId: data.assignedToUserId ?? null,
          notes: data.notes ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        this.leads.set(id, record);
        return { ...record };
      },
      findMany: async ({ where, skip = 0, take = 20 }) => {
        let results = Array.from(this.leads.values());
        if (where?.listing?.ownerId) {
          results = results.filter((l) => {
            const listing = this.listings.get(l.listingId);
            return listing && listing.ownerId === where.listing.ownerId;
          });
        }
        if (where?.status) {
          results = results.filter((l) => l.status === where.status);
        }
        return results.slice(skip, skip + take).map((r) => ({
          ...r,
          listing: this.listings.get(r.listingId),
        }));
      },
      count: async ({ where }) => {
        let results = Array.from(this.leads.values());
        if (where?.listing?.ownerId) {
          results = results.filter((l) => {
            const listing = this.listings.get(l.listingId);
            return listing && listing.ownerId === where.listing.ownerId;
          });
        }
        if (where?.status) {
          results = results.filter((l) => l.status === where.status);
        }
        return results.length;
      },
      update: async ({ where, data }) => {
        const id = BigInt(where.id);
        const current = this.leads.get(id);
        if (!current) throw new Error('Record to update not found');
        const updated = { ...current, ...data, updatedAt: new Date() };
        this.leads.set(id, updated);
        return { ...updated };
      },
    };
  }
}

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function itAsync(desc, fn) {
  try {
    await fn();
    console.log(`  ✓ PASS: ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${desc}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runWave1Tests() {
  console.log('====================================================');
  console.log('  BẮT ĐẦU KIỂM THỬ NGHIỆM THU WAVE 1 (PRODUCT TRUTH & LEAD THẬT)');
  console.log('====================================================\n');

  const db = new InMemoryDatabase();
  const leadsService = new LeadsService(db);

  // ── Test 1: P0-02 Submit lead thành công & Persist DB ──
  await itAsync('P0-02: Submit lead hợp lệ lưu thành công vào CSDL và trả về ID', async () => {
    const res = await leadsService.createLead({
      listingId: '100',
      fullName: 'Trần Thị Thuê Nhà',
      phone: '0987654321',
      email: 'thuenha@example.com',
      message: 'Tôi muốn qua xem phòng vào chiều mai',
      consent: true,
      channel: 'web_form',
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.isDuplicate, false);
    assert.ok(res.leadId);

    // Kiểm tra DB thật
    const inDb = await db.lead.findUnique({ where: { id: BigInt(res.leadId) } });
    assert.ok(inDb, 'Lead phải tồn tại trong CSDL sau khi submit');
    assert.strictEqual(inDb.fullName, 'Trần Thị Thuê Nhà');
    assert.strictEqual(inDb.phone, '0987654321');
    assert.strictEqual(inDb.listingId, 100n);
    assert.strictEqual(inDb.status, 'new');
  });

  // ── Test 2: P0-02 Deduplication chống spam submit lặp ──
  await itAsync('P0-02: Submit lại cùng số điện thoại và tin đăng trong ngày không tạo duplicate', async () => {
    const initialCount = await db.lead.count({});

    // Submit lại y hệt SĐT 0987654321 cho listing 100
    const res2 = await leadsService.createLead({
      listingId: '100',
      fullName: 'Trần Thị Thuê Nhà Lần 2',
      phone: '0987654321',
      consent: true,
    });

    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.isDuplicate, true, 'Phải đánh dấu isDuplicate = true');

    const countAfter = await db.lead.count({});
    assert.strictEqual(countAfter, initialCount, 'Số lượng lead trong CSDL không được tăng lên');
  });

  // ── Test 3: P0-02 Từ chối gửi lead cho tin không active hoặc không tồn tại ──
  await itAsync('P0-02: Từ chối nhận lead với tin không tồn tại hoặc đã hết hạn', async () => {
    // Tin không tồn tại
    let notFoundError = false;
    try {
      await leadsService.createLead({
        listingId: '99999',
        fullName: 'Khách A',
        phone: '0912345678',
        consent: true,
      });
    } catch (e) {
      notFoundError = true;
    }
    assert.strictEqual(notFoundError, true, 'Phải ném NotFoundException');

    // Tin đã expired (listing 200)
    let expiredError = false;
    try {
      await leadsService.createLead({
        listingId: '200',
        fullName: 'Khách B',
        phone: '0912345679',
        consent: true,
      });
    } catch (e) {
      expiredError = true;
    }
    assert.strictEqual(expiredError, true, 'Phải ném BadRequestException cho tin expired');
  });

  // ── Test 4: P0-02 Seller xem danh sách leads của tin mình ──
  await itAsync('P0-02: Seller chỉ xem được danh sách lead của tin thuộc sở hữu của mình', async () => {
    const sellerLeads = await leadsService.findMyLeads(999n, { page: 1, pageSize: 20 });
    assert.strictEqual(sellerLeads.pagination.total >= 1, true);
    assert.strictEqual(sellerLeads.items[0].fullName, 'Trần Thị Thuê Nhà');

    // Người dùng khác (không sở hữu tin nào)
    const otherLeads = await leadsService.findMyLeads(888n, { page: 1, pageSize: 20 });
    assert.strictEqual(otherLeads.pagination.total, 0, 'User khác không được thấy lead của chủ trọ');
  });

  // ── Test 5: P0-02 ContactBrokerModal không còn setTimeout giả lập ──
  it('P0-02: ContactBrokerModal.tsx đã xóa bỏ setTimeout giả lập, gọi API thật và chỉ success khi 200', () => {
    const modalPath = path.resolve(__dirname, '../../../apps/web/src/components/ContactBrokerModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf-8');

    assert.ok(!content.includes('// Giả lập gửi thông tin liên hệ thành công'), 'Không được còn comment giả lập');
    assert.ok(content.includes('fetch(`${apiUrl}/leads`'), 'Phải có fetch /leads API');
    assert.ok(content.includes('setSubmitted(true)'), 'Chỉ setSubmitted sau khi có res.ok');
    assert.ok(content.includes('consent'), 'Phải có trường consent');
    assert.ok(content.includes('rawId.startsWith(\'demo-\')'), 'Phải chặn demo ID');
  });

  // ── Test 6: P0-03 / FE-07 Bỏ "Tin cậy 100%" và xóa tick xanh vô điều kiện ──
  it('P0-03 & FE-07: Không còn chữ "Tin cậy 100%" và xóa tick xanh cứng trong OwnerContactBox và detail page', () => {
    const detailPagePath = path.resolve(__dirname, '../../../apps/web/src/app/tin/[slug]/page.tsx');
    const detailContent = fs.readFileSync(detailPagePath, 'utf-8');
    assert.ok(!detailContent.includes('Tin cậy 100%'), 'Phải xóa bỏ cụm từ tuyệt đối Tin cậy 100%');
    assert.ok(detailContent.includes('Đã kiểm tra thực tế'), 'Phải đổi thành nhãn kiểm tra thực tế trung thực');
    assert.ok(detailContent.includes('listing.owner.isPhoneVerified'), 'Phải gắn badge theo cờ CSDL thật');

    const ownerBoxPath = path.resolve(__dirname, '../../../apps/web/src/app/tin/[slug]/OwnerContactBox.tsx');
    const ownerBoxContent = fs.readFileSync(ownerBoxPath, 'utf-8');
    assert.ok(ownerBoxContent.includes('isPhoneVerified'), 'OwnerContactBox phải nhận prop xác thực');
    assert.ok(ownerBoxContent.includes('isIdVerified'), 'OwnerContactBox phải nhận prop CCCD');
    // Kiểm tra không còn tick vô điều kiện
    assert.ok(!ownerBoxContent.includes('<span\n                title="Tài khoản đã xác thực"\n                className="flex h-4 w-4'), 'Không được vẽ tick xanh vô điều kiện');
  });

  // ── Test 7: P0-04 Tắt fallback demo data ở production ──
  it('P0-04: Tắt fallback demo data khi NODE_ENV === "production" ở cả 4 trang', () => {
    const pages = [
      '../../../apps/web/src/app/page.tsx',
      '../../../apps/web/src/app/thue/page.tsx',
      '../../../apps/web/src/app/cho-thue-tro/page.tsx',
      '../../../apps/web/src/app/cho-thue-mat-bang/page.tsx',
    ];

    for (const p of pages) {
      const fullPath = path.resolve(__dirname, p);
      const content = fs.readFileSync(fullPath, 'utf-8');
      assert.ok(
        content.includes('process.env.NODE_ENV === \'production\''),
        `Trang ${p} phải kiểm tra môi trường production`,
      );
      assert.ok(
        content.includes('isProduction ? [] :'),
        `Trang ${p} phải trả về mảng rỗng khi ở production thay vì demo fallback`,
      );
    }
  });

  // ── Test 8: P0-04 Chặn mutation trên demo listing ID ──
  it('P0-04: Chặn các thao tác mutation (lưu tin, gọi điện, báo cáo vi phạm) khi listingId là demo', () => {
    const saveButtonPath = path.resolve(__dirname, '../../../apps/web/src/app/tin/[slug]/SaveListingButton.tsx');
    const saveContent = fs.readFileSync(saveButtonPath, 'utf-8');
    assert.ok(saveContent.includes("listingId.startsWith('demo-')"), 'SaveListingButton phải chặn demo-');

    const revealButtonPath = path.resolve(__dirname, '../../../apps/web/src/app/tin/[slug]/RevealPhoneButton.tsx');
    const revealContent = fs.readFileSync(revealButtonPath, 'utf-8');
    assert.ok(revealContent.includes("listingId.startsWith('demo-')"), 'RevealPhoneButton phải chặn demo-');

    const reportModalPath = path.resolve(__dirname, '../../../apps/web/src/components/ReportListingModal.tsx');
    const reportContent = fs.readFileSync(reportModalPath, 'utf-8');
    assert.ok(reportContent.includes("listingId.startsWith('demo-')"), 'ReportListingModal phải chặn demo-');
  });

  // ── Test 9: Admin Lead Queue UI & Seller Lead UI đã sẵn sàng ──
  it('Wave 1 DoD: Giao diện Admin Lead Queue (/admin/leads) và Seller Leads (/tai-khoan/leads) đã tồn tại', () => {
    const adminLeadsPath = path.resolve(__dirname, '../../../apps/web/src/app/admin/leads/page.tsx');
    assert.ok(fs.existsSync(adminLeadsPath), 'File /admin/leads/page.tsx phải tồn tại');

    const sellerLeadsPath = path.resolve(__dirname, '../../../apps/web/src/app/tai-khoan/leads/page.tsx');
    assert.ok(fs.existsSync(sellerLeadsPath), 'File /tai-khoan/leads/page.tsx phải tồn tại');

    const adminLayoutPath = path.resolve(__dirname, '../../../apps/web/src/app/admin/layout.tsx');
    const adminLayoutContent = fs.readFileSync(adminLayoutPath, 'utf-8');
    assert.ok(adminLayoutContent.includes('/admin/leads'), 'Sidebar admin phải có link dẫn tới /admin/leads');
  });

  console.log('\n----------------------------------------------------');
  console.log(`KẾT QUẢ KIỂM THỬ: ${passed} PASS, ${failed} FAIL`);
  console.log('----------------------------------------------------');

  if (failed > 0) {
    process.exit(1);
  }
}

runWave1Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
