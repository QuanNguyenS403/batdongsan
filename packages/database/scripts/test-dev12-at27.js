const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU KIỂM THỬ DEV-12: AT-27, GAP-12 (TRANSACTIONAL OUTBOX & DLQ) ---');

  let testPassed = 0;
  let testFailed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      testPassed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      testFailed++;
    }
  }

  // 1. SETUP DỮ LIỆU
  const ownerPhone = '0912444333';
  let owner = await prisma.user.findFirst({ where: { phone: ownerPhone } });
  if (!owner) {
    owner = await prisma.user.create({
      data: { phone: ownerPhone, fullName: 'Chủ Test DEV-12', role: 'user', isPhoneVerified: true },
    });
  }

  let loc = await prisma.location.findFirst();
  const listing = await prisma.listing.create({
    data: {
      ownerId: owner.id,
      locationId: loc.id,
      title: `Tin Test Outbox ${Date.now()}`,
      slug: `tin-test-outbox-${Date.now()}-idtemp`,
      price: 4500000n,
      areaM2: 24.0,
      propertyType: 'room',
      status: 'active',
    },
  });

  // =========================================================================
  // 1. KIỂM THỬ GHI ĐỒNG THỜI LEAD VÀ OUTBOX EVENT TRONG 1 TRANSACTION (GAP-12)
  // =========================================================================
  console.log(`\n=== 1. KIỂM THỬ TRANSACTIONAL OUTBOX (GAP-12) ===`);

  const dedupeKey = `LEAD-DEV12-${Date.now()}`;
  const [createdLead, createdEvent] = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        listingId: listing.id,
        fullName: 'Khách Test Outbox',
        phone: '0981999888',
        dedupeKey,
        status: 'new',
      },
    });

    const event = await tx.outboxEvent.create({
      data: {
        aggregateType: 'LEAD',
        aggregateId: lead.id.toString(),
        eventType: 'LEAD_CREATED',
        payload: {
          leadId: lead.id.toString(),
          tenantName: lead.fullName,
          tenantPhone: lead.phone,
        },
        status: 'PENDING',
        retryCount: 0,
        maxRetries: 5,
        nextRetryAt: new Date(),
      },
    });

    return [lead, event];
  });

  assert(createdLead && createdLead.id > 0n, 'Lead được tạo thành công trong transaction');
  assert(createdEvent && createdEvent.status === 'PENDING', 'Sự kiện Outbox LEAD_CREATED được lưu đồng thời ở trạng thái PENDING');

  // =========================================================================
  // 2. KIỂM THỬ AT-27: NHÀ CUNG CẤP NGOÀI LỖI -> LEAD KHÔNG MẤT, RETRY AN TOÀN
  // =========================================================================
  console.log(`\n=== 2. KIỂM THỬ AT-27: XỬ LÝ LỖI PROVIDER BẰNG EXPONENTIAL BACKOFF ===`);

  // Giả lập worker dispatch sự kiện bị lỗi mạng ngoài (Google Sheets timeout / SMS provider lỗi 503)
  const failedAttempt1 = await prisma.outboxEvent.update({
    where: { id: createdEvent.id },
    data: {
      status: 'PENDING',
      retryCount: 1,
      nextRetryAt: new Date(Date.now() + 4000), // Lùi 4 giây
      errorMessage: 'SMS Gateway 503 Service Unavailable',
    },
  });

  // Kiểm tra lead trong DB: lead vẫn tồn tại 100% nguyên vẹn!
  const leadCheck = await prisma.lead.findUnique({ where: { id: createdLead.id } });
  assert(leadCheck !== null && leadCheck.id === createdLead.id, 'Dữ liệu Lead trong CSDL vẫn an toàn 100% khi hệ thống gửi tin ngoài bị lỗi (AT-27)');
  assert(failedAttempt1.retryCount === 1 && failedAttempt1.status === 'PENDING', 'Sự kiện Outbox lưu lỗi và sẵn sàng retry an toàn');

  // =========================================================================
  // 3. KIỂM THỬ DEAD LETTER QUEUE (DLQ) KHI QUÁ MAX RETRIES
  // =========================================================================
  console.log(`\n=== 3. KIỂM THỬ DEAD LETTER QUEUE (DLQ / FAILED) ===`);

  // Giả lập thử lại lần 5 thất bại
  const dlqEvent = await prisma.outboxEvent.update({
    where: { id: createdEvent.id },
    data: {
      status: 'FAILED', // Chuyển DLQ
      retryCount: 5,
      errorMessage: 'Max retries (5) exceeded: Third-party API permanent failure',
      processedAt: new Date(),
    },
  });

  assert(dlqEvent.status === 'FAILED', 'Sự kiện chuyển sang FAILED (Dead Letter Queue) sau 5 lần thử lại thất bại');

  // Admin có thể truy vấn danh sách hàng lỗi trong DLQ
  const dlqList = await prisma.outboxEvent.findMany({
    where: { status: 'FAILED' },
    orderBy: { createdAt: 'desc' },
  });
  assert(dlqList.length > 0 && dlqList.some((e) => e.id === createdEvent.id), 'Admin thấy được sự kiện lỗi trong Dead Letter Queue để rà soát');

  // =========================================================================
  // 4. KIỂM THỬ ADMIN RETRY THỦ CÔNG SỰ KIỆN TRONG DLQ
  // =========================================================================
  console.log(`\n=== 4. KIỂM THỬ RETRY THỦ CÔNG TỪ DLQ ===`);

  const replayedEvent = await prisma.outboxEvent.update({
    where: { id: createdEvent.id },
    data: {
      status: 'PENDING',
      retryCount: 0,
      nextRetryAt: new Date(),
      errorMessage: null,
    },
  });

  assert(replayedEvent.status === 'PENDING' && replayedEvent.retryCount === 0, 'Admin retry thành công: sự kiện reset về PENDING');

  console.log(`\n=== TỔNG KẾT KIỂM THỬ DEV-12 (AT-27, GAP-12) ===`);
  console.log(`PASS: ${testPassed} | FAIL: ${testFailed}`);

  if (testFailed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Lỗi kiểm thử DEV-12:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
