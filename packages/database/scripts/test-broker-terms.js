/**
 * TEST-BROKER-TERMS.JS — Kiểm thử tự động luồng Điều khoản môi giới bắt buộc (GAP-09 / W-05)
 *
 * Kiểm tra:
 * 1. Chủ tài khoản mới chưa chấp thuận: getBrokerTermsStatus trả hasAcceptedBrokerTerms = false
 * 2. acceptBrokerTerms: tạo Document BROKER_TERMS_V2 và DocumentAcceptance hợp lệ
 * 3. getBrokerTermsStatus sau khi chấp thuận: trả hasAcceptedBrokerTerms = true
 * 4. me(): trả về trường hasAcceptedBrokerTerms đồng bộ
 * 5. createListing: người dùng chưa chấp thuận điều khoản bị chặn bởi ForbiddenException
 * 6. createListing: người dùng đã chấp thuận điều khoản được phép tạo tin đăng thành công
 * 7. createListing: tài khoản admin được phép tạo tin mà không bị chặn
 */

const assert = require('assert');

// Mock Prisma for Testing
class MockTermsPrisma {
  constructor() {
    this.users = new Map();
    this.documents = new Map();
    this.documentAcceptances = new Map();
    this.listings = new Map();
    this.userMemberships = new Map();
    this.nextDocId = 1n;
    this.nextAcceptanceId = 1n;
    this.nextListingId = 1n;

    this.user = {
      findUnique: async ({ where, include }) => {
        const u = this.users.get(BigInt(where.id));
        if (!u) return null;
        const res = { ...u };
        if (include && include.documentAcceptances) {
          const docCode = include.documentAcceptances.where?.document?.docCode;
          const acceptances = Array.from(this.documentAcceptances.values()).filter((a) => {
            if (a.userId !== u.id) return false;
            if (docCode) {
              const doc = this.documents.get(a.documentId);
              return doc && doc.docCode === docCode;
            }
            return true;
          });
          res.documentAcceptances = acceptances;
        }
        return res;
      },
    };

    this.document = {
      findUnique: async ({ where }) => {
        if (where.docCode) {
          for (const doc of this.documents.values()) {
            if (doc.docCode === where.docCode) return doc;
          }
        }
        return null;
      },
      create: async ({ data }) => {
        const id = this.nextDocId++;
        const record = { id, ...data, createdAt: new Date() };
        this.documents.set(id, record);
        return record;
      },
    };

    this.documentAcceptance = {
      findUnique: async ({ where }) => {
        const { documentId, userId } = where.documentId_userId;
        const key = `${documentId}_${userId}`;
        return this.documentAcceptances.get(key) || null;
      },
      findFirst: async ({ where }) => {
        for (const a of this.documentAcceptances.values()) {
          if (where.userId && a.userId !== where.userId) continue;
          if (where.document && where.document.docCode) {
            const doc = this.documents.get(a.documentId);
            if (!doc || doc.docCode !== where.document.docCode) continue;
          }
          return a;
        }
        return null;
      },
      upsert: async ({ where, create, update }) => {
        const { documentId, userId } = where.documentId_userId;
        const key = `${documentId}_${userId}`;
        const existing = this.documentAcceptances.get(key);
        if (existing) {
          const updated = { ...existing, ...update };
          this.documentAcceptances.set(key, updated);
          return updated;
        }
        const id = this.nextAcceptanceId++;
        const record = { id, ...create };
        this.documentAcceptances.set(key, record);
        return record;
      },
    };

    this.listing = {
      count: async () => this.listings.size,
      create: async ({ data }) => {
        const id = this.nextListingId++;
        const record = { id, ...data, createdAt: new Date() };
        this.listings.set(id, record);
        return record;
      },
    };

    this.userMembership = {
      findFirst: async () => null,
    };

    this.$transaction = async (cb) => cb(this);
  }
}

// Logic mô phỏng trực tiếp từ auth.service.ts
class MockAuthService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async me(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        documentAcceptances: {
          where: {
            document: { docCode: 'BROKER_TERMS_V2' },
          },
          select: { acceptedAt: true },
        },
      },
    });
    if (!user) throw new Error('Unauthorized');
    const hasAccepted = (user.documentAcceptances?.length ?? 0) > 0;
    return {
      id: user.id.toString(),
      phone: user.phone,
      hasAcceptedBrokerTerms: hasAccepted,
      brokerTermsAcceptedAt: user.documentAcceptances?.[0]?.acceptedAt ?? null,
    };
  }

  async getBrokerTermsStatus(userId) {
    const doc = await this.prisma.document.findUnique({
      where: { docCode: 'BROKER_TERMS_V2' },
    });
    if (!doc) {
      return { hasAcceptedBrokerTerms: false, acceptedAt: null, version: '2.0' };
    }
    const acceptance = await this.prisma.documentAcceptance.findUnique({
      where: {
        documentId_userId: {
          documentId: doc.id,
          userId,
        },
      },
    });
    return {
      hasAcceptedBrokerTerms: !!acceptance,
      acceptedAt: acceptance?.acceptedAt ?? null,
      version: doc.version,
    };
  }

  async acceptBrokerTerms(userId, ipAddress, userAgent) {
    let doc = await this.prisma.document.findUnique({
      where: { docCode: 'BROKER_TERMS_V2' },
    });
    if (!doc) {
      doc = await this.prisma.document.create({
        data: {
          docCode: 'BROKER_TERMS_V2',
          docType: 'terms_of_service',
          title: 'Điều khoản và Chính sách Dịch vụ Môi giới Cho thuê QNS BROKER',
          version: '2.0',
          fileUrl: '/dieu-khoan',
          fileHash: 'sha256:qns-broker-terms-v2',
          isCurrent: true,
        },
      });
    }

    const acceptance = await this.prisma.documentAcceptance.upsert({
      where: {
        documentId_userId: {
          documentId: doc.id,
          userId,
        },
      },
      create: {
        documentId: doc.id,
        userId,
        acceptedAt: new Date(),
        acceptanceMethod: 'click_agree',
        ipAddress: ipAddress ? String(ipAddress).substring(0, 50) : null,
        userAgent: userAgent ? String(userAgent).substring(0, 255) : null,
      },
      update: {
        acceptedAt: new Date(),
        acceptanceMethod: 'click_agree',
        ipAddress: ipAddress ? String(ipAddress).substring(0, 50) : null,
        userAgent: userAgent ? String(userAgent).substring(0, 255) : null,
      },
    });

    return {
      success: true,
      message: 'Đã xác nhận chấp thuận Điều khoản dịch vụ môi giới thành công',
      hasAcceptedBrokerTerms: true,
      acceptedAt: acceptance.acceptedAt,
    };
  }
}

// Logic kiểm tra trong createListing mô phỏng từ listings.service.ts
async function mockCreateListing(prisma, ownerId, dto) {
  return prisma.$transaction(async (tx) => {
    // 0. Bắt buộc chấp thuận Điều khoản & Chính sách dịch vụ môi giới cho thuê (GAP-09 / W-05)
    const user = await tx.user.findUnique({ where: { id: ownerId } });
    if (user?.role !== 'admin') {
      const hasAcceptedTerms = await tx.documentAcceptance.findFirst({
        where: {
          userId: ownerId,
          document: { docCode: 'BROKER_TERMS_V2' },
        },
      });
      if (!hasAcceptedTerms) {
        const anyAccepted = await tx.documentAcceptance.findFirst({
          where: { userId: ownerId },
        });
        if (!anyAccepted) {
          throw new Error('FORBIDDEN_TERMS: Bạn cần xác nhận đồng ý với Điều khoản và Chính sách dịch vụ môi giới trước khi bắt đầu đăng tin');
        }
      }
    }

    return tx.listing.create({
      data: {
        ownerId,
        title: dto.title,
        price: dto.price,
      },
    });
  });
}

// Chạy bộ test
async function runTests() {
  console.log('--- BẮT ĐẦU TEST LUỒNG ĐIỀU KHOẢN MÔI GIỚI BẮT BUỘC (GAP-09 / W-05) ---');
  const prisma = new MockTermsPrisma();
  const authService = new MockAuthService(prisma);

  const owner1Id = 101n;
  const owner2Id = 102n;
  const adminId = 999n;

  prisma.users.set(owner1Id, { id: owner1Id, phone: '0981111111', role: 'user' });
  prisma.users.set(owner2Id, { id: owner2Id, phone: '0982222222', role: 'user' });
  prisma.users.set(adminId, { id: adminId, phone: '0989999999', role: 'admin' });

  // Test 1: Tài khoản mới chưa đồng ý điều khoản
  const statusBefore = await authService.getBrokerTermsStatus(owner1Id);
  assert.strictEqual(statusBefore.hasAcceptedBrokerTerms, false, 'Test 1 FAIL: Chưa đồng ý nhưng hasAcceptedBrokerTerms lại là true');
  console.log('✅ Test 1 PASS: Tài khoản mới chưa chấp thuận có hasAcceptedBrokerTerms = false');

  // Test 2: Thử đăng tin khi chưa đồng ý -> Bị chặn
  let blocked = false;
  try {
    await mockCreateListing(prisma, owner1Id, { title: 'Phòng trọ quận Hai Bà Trưng', price: 3500000 });
  } catch (err) {
    if (err.message.includes('FORBIDDEN_TERMS')) blocked = true;
  }
  assert.strictEqual(blocked, true, 'Test 2 FAIL: Chưa đồng ý điều khoản nhưng vẫn tạo được tin');
  console.log('✅ Test 2 PASS: Chưa đồng ý điều khoản bị chặn bởi ForbiddenException khi đăng tin');

  // Test 3: Thực hiện ký chấp thuận điều khoản qua API
  const acceptRes = await authService.acceptBrokerTerms(owner1Id, '127.0.0.1', 'Mozilla/5.0');
  assert.strictEqual(acceptRes.success, true, 'Test 3a FAIL: acceptBrokerTerms không trả success');
  assert.strictEqual(acceptRes.hasAcceptedBrokerTerms, true, 'Test 3b FAIL: acceptBrokerTerms không trả hasAccepted');
  assert(acceptRes.acceptedAt instanceof Date, 'Test 3c FAIL: acceptedAt không phải Date');
  console.log('✅ Test 3 PASS: acceptBrokerTerms tạo Document & DocumentAcceptance thành công');

  // Test 4: Kiểm tra lại status sau khi đã đồng ý
  const statusAfter = await authService.getBrokerTermsStatus(owner1Id);
  assert.strictEqual(statusAfter.hasAcceptedBrokerTerms, true, 'Test 4 FAIL: Đã đồng ý nhưng status trả false');
  console.log('✅ Test 4 PASS: getBrokerTermsStatus trả hasAcceptedBrokerTerms = true sau khi đồng ý');

  // Test 5: /auth/me trả về trạng thái đồng bộ
  const meRes = await authService.me(owner1Id);
  assert.strictEqual(meRes.hasAcceptedBrokerTerms, true, 'Test 5 FAIL: /auth/me không trả hasAcceptedBrokerTerms = true');
  console.log('✅ Test 5 PASS: /auth/me trả hasAcceptedBrokerTerms = true đồng bộ');

  // Test 6: Đăng tin sau khi đã đồng ý điều khoản -> Thành công
  const listing = await mockCreateListing(prisma, owner1Id, { title: 'Phòng trọ quận Hai Bà Trưng', price: 3500000 });
  assert.strictEqual(listing.title, 'Phòng trọ quận Hai Bà Trưng', 'Test 6 FAIL: Không tạo được tin sau khi đã đồng ý');
  console.log('✅ Test 6 PASS: Đăng tin thành công sau khi đã chấp thuận điều khoản');

  // Test 7: Tài khoản khác chưa đồng ý vẫn bị chặn độc lập
  let owner2Blocked = false;
  try {
    await mockCreateListing(prisma, owner2Id, { title: 'Studio ban công Đống Đa', price: 5000000 });
  } catch (err) {
    if (err.message.includes('FORBIDDEN_TERMS')) owner2Blocked = true;
  }
  assert.strictEqual(owner2Blocked, true, 'Test 7 FAIL: Owner 2 chưa đồng ý nhưng không bị chặn');
  console.log('✅ Test 7 PASS: Trạng thái chấp thuận cô lập theo từng user ID');

  // Test 8: Tài khoản admin không bị chặn
  const adminListing = await mockCreateListing(prisma, adminId, { title: 'Căn hộ chung cư cao cấp', price: 12000000 });
  assert.strictEqual(adminListing.title, 'Căn hộ chung cư cao cấp', 'Test 8 FAIL: Admin bị chặn tạo tin');
  console.log('✅ Test 8 PASS: Tài khoản admin không bị chặn');

  console.log('--- HOÀN TẤT 8/8 TEST ĐIỀU KHOẢN MÔI GIỚI BẮT BUỘC: PASS 100% ---');
}

runTests().catch((err) => {
  console.error('TEST ERROR:', err);
  process.exit(1);
});
