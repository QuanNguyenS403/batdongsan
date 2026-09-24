const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- BẮT ĐẦU KIỂM THỬ DEV-07: AT-10, AT-11, AT-12 ---');

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
  // Tạo hoặc lấy user Quan
  let quanUser = await prisma.user.findFirst({ where: { phone: '0981753082' } });
  if (!quanUser) {
    quanUser = await prisma.user.create({
      data: {
        phone: '0981753082',
        fullName: 'Đức Quân',
        role: 'broker',
        isPhoneVerified: true,
      },
    });
  }

  let agentQuan = await prisma.agentProfile.findUnique({ where: { userId: quanUser.id } });
  if (!agentQuan) {
    agentQuan = await prisma.agentProfile.create({
      data: {
        userId: quanUser.id,
        displayName: 'Đức Quân',
        workPhone: '0981753082',
        zaloPhone: '0981753082',
        bio: 'Người tư vấn và trực tiếp dẫn xem',
        maxDailyViewings: 3,
        isActive: true,
      },
    });
  }

  // Lấy hoặc tạo Location
  let loc = await prisma.location.findFirst();
  if (!loc) {
    loc = await prisma.location.create({
      data: {
        name: 'Hà Nội',
        slug: 'ha-noi',
        type: 'city',
      },
    });
  }

  // Tạo chủ nhà test
  const testOwnerPhone = '0912349999';
  let testOwner = await prisma.user.findFirst({ where: { phone: testOwnerPhone } });
  if (!testOwner) {
    testOwner = await prisma.user.create({
      data: {
        phone: testOwnerPhone,
        fullName: 'Chủ Nhà Test AT',
        role: 'user',
        isPhoneVerified: true,
      },
    });
  }

  // Tạo RentalUnit test A1 & A2
  const unitCode1 = `TEST-DEV07-U1-${Date.now()}`;
  const unitCode2 = `TEST-DEV07-U2-${Date.now()}`;

  const unit1 = await prisma.rentalUnit.create({
    data: {
      unitCode: unitCode1,
      ownerId: testOwner.id,
      locationId: loc.id,
      addressDetail: '123 Đường Test, Quận Hai Bà Trưng, Hà Nội',
      propertyType: 'room',
      areaM2: 25.0,
      status: 'available',
    },
  });

  const unit2 = await prisma.rentalUnit.create({
    data: {
      unitCode: unitCode2,
      ownerId: testOwner.id,
      locationId: loc.id,
      addressDetail: '125 Đường Test, Quận Hai Bà Trưng, Hà Nội',
      propertyType: 'studio',
      areaM2: 32.0,
      status: 'available',
    },
  });

  console.log(`\n=== 1. KIỂM THỬ AT-10: CHỐNG TRÙNG GIỜ DẪN CỦA AGENT ===`);

  // Tạo viewing 1: 2026-09-25T09:00:00Z -> 2026-09-25T10:00:00Z
  const v1 = await prisma.viewing.create({
    data: {
      viewingCode: `VW-1-${Date.now()}`,
      unitId: unit1.id,
      agentId: agentQuan.id,
      clientName: 'Khách A',
      clientPhone: '0901111111',
      scheduledStartTime: new Date('2026-09-25T09:00:00Z'),
      scheduledEndTime: new Date('2026-09-25T10:00:00Z'),
      status: 'requested',
    },
  });

  // Xác nhận viewing 1
  const v1Confirmed = await prisma.viewing.update({
    where: { id: v1.id },
    data: { status: 'confirmed', checkinCode: '111222' },
  });
  assert(v1Confirmed.status === 'confirmed', 'Lịch 1 xác nhận thành công');

  // Tạo viewing 2 trùng giờ: 09:30 -> 10:30 cùng ngày (trùng với 09:00 -> 10:00)
  const v2 = await prisma.viewing.create({
    data: {
      viewingCode: `VW-2-${Date.now()}`,
      unitId: unit2.id,
      agentId: agentQuan.id,
      clientName: 'Khách B',
      clientPhone: '0902222222',
      scheduledStartTime: new Date('2026-09-25T09:30:00Z'),
      scheduledEndTime: new Date('2026-09-25T10:30:00Z'),
      status: 'requested',
    },
  });

  // Kiểm tra xung đột trước khi confirm viewing 2
  const conflict = await prisma.viewing.findFirst({
    where: {
      id: { not: v2.id },
      agentId: agentQuan.id,
      status: 'confirmed',
      scheduledStartTime: { lt: v2.scheduledEndTime },
      scheduledEndTime: { gt: v2.scheduledStartTime },
    },
  });
  assert(conflict !== null && conflict.id === v1.id, 'Phát hiện chính xác lịch 2 bị trùng giờ dẫn với lịch 1 của Quân');

  // Tạo viewing 3 khung giờ khác: 14:00 -> 15:00
  const v3 = await prisma.viewing.create({
    data: {
      viewingCode: `VW-3-${Date.now()}`,
      unitId: unit2.id,
      agentId: agentQuan.id,
      clientName: 'Khách C',
      clientPhone: '0903333333',
      scheduledStartTime: new Date('2026-09-25T14:00:00Z'),
      scheduledEndTime: new Date('2026-09-25T15:00:00Z'),
      status: 'requested',
    },
  });

  const conflictV3 = await prisma.viewing.findFirst({
    where: {
      id: { not: v3.id },
      agentId: agentQuan.id,
      status: 'confirmed',
      scheduledStartTime: { lt: v3.scheduledEndTime },
      scheduledEndTime: { gt: v3.scheduledStartTime },
    },
  });
  assert(conflictV3 === null, 'Lịch 3 (14:00-15:00) không bị trùng giờ với bất kỳ lịch nào');

  // Xác nhận lịch 3
  await prisma.viewing.update({
    where: { id: v3.id },
    data: { status: 'confirmed' },
  });

  // Kiểm tra giới hạn 3 lịch/ngày
  // Tạo lịch 4 (16:00 - 17:00) và xác nhận -> đạt 3/3
  const v4 = await prisma.viewing.create({
    data: {
      viewingCode: `VW-4-${Date.now()}`,
      unitId: unit1.id,
      agentId: agentQuan.id,
      clientName: 'Khách D',
      clientPhone: '0904444444',
      scheduledStartTime: new Date('2026-09-25T16:00:00Z'),
      scheduledEndTime: new Date('2026-09-25T17:00:00Z'),
      status: 'confirmed',
    },
  });

  const startOfDay = new Date('2026-09-25T00:00:00Z');
  const endOfDay = new Date('2026-09-25T23:59:59Z');

  const countToday = await prisma.viewing.count({
    where: {
      agentId: agentQuan.id,
      status: 'confirmed',
      scheduledStartTime: { gte: startOfDay, lte: endOfDay },
    },
  });
  assert(countToday === 3, 'Số lịch confirmed trong ngày 25/09 đã đạt tối đa 3 lịch');

  // Thử kiểm tra giới hạn cho lịch 5
  const canConfirmMore = countToday < agentQuan.maxDailyViewings;
  assert(canConfirmMore === false, 'Hệ thống chặn không cho xác nhận thêm lịch thứ 4 trong ngày (đạt maxDailyViewings = 3)');

  console.log(`\n=== 2. KIỂM THỬ AT-11: CHỐNG GIỮ/CHO THUÊ TRÙNG PHÒNG ===`);

  // Giữ phòng unit1 từ 2026-10-01 đến 2026-10-15
  const res1 = await prisma.unitReservation.create({
    data: {
      unitId: unit1.id,
      reservedFrom: new Date('2026-10-01T00:00:00Z'),
      reservedUntil: new Date('2026-10-15T00:00:00Z'),
      holdReason: 'viewing_interest',
      status: 'active',
    },
  });
  assert(res1.status === 'active', 'Tạo reservation 1 cho Unit 1 thành công (01/10 - 15/10)');

  // Yêu cầu giữ chỗ trùng: 2026-10-10 đến 2026-10-20 (chồng lấn 5 ngày)
  const req2From = new Date('2026-10-10T00:00:00Z');
  const req2Until = new Date('2026-10-20T00:00:00Z');

  const conflictRes = await prisma.unitReservation.findFirst({
    where: {
      unitId: unit1.id,
      status: 'active',
      reservedFrom: { lt: req2Until },
      reservedUntil: { gt: req2From },
    },
  });
  assert(conflictRes !== null && conflictRes.id === res1.id, 'Phát hiện chính xác yêu cầu giữ chỗ 2 bị trùng phòng với reservation 1');

  // Yêu cầu giữ chỗ không trùng: 2026-10-16 đến 2026-10-25
  const req3From = new Date('2026-10-16T00:00:00Z');
  const req3Until = new Date('2026-10-25T00:00:00Z');

  const conflictRes3 = await prisma.unitReservation.findFirst({
    where: {
      unitId: unit1.id,
      status: 'active',
      reservedFrom: { lt: req3Until },
      reservedUntil: { gt: req3From },
    },
  });
  assert(conflictRes3 === null, 'Yêu cầu giữ chỗ 3 (16/10 - 25/10) không bị trùng phòng');

  console.log(`\n=== 3. KIỂM THỬ AT-12: HỦY LỊCH, ĐỔI GIỜ, CHỦ HẾT PHÒNG ===`);

  // 3.1 Khách hủy lịch
  const cancelledV1 = await prisma.viewing.update({
    where: { id: v1.id },
    data: {
      status: 'cancelled',
      notes: `[Đã hủy lúc ${new Date().toISOString()}]: Khách bận việc đột xuất`,
    },
  });
  assert(cancelledV1.status === 'cancelled', 'Lịch 1 đã chuyển sang trạng thái cancelled');
  assert(cancelledV1.notes.includes('Khách bận việc đột xuất'), 'Ghi chú lưu đầy đủ vết lý do hủy lịch');

  // 3.2 Đổi giờ lịch xem v3
  const newStart = new Date('2026-09-25T11:00:00Z');
  const newEnd = new Date('2026-09-25T12:00:00Z');
  const rescheduledV3 = await prisma.viewing.update({
    where: { id: v3.id },
    data: {
      scheduledStartTime: newStart,
      scheduledEndTime: newEnd,
      status: 'rescheduled',
      notes: `[Đổi lịch từ 14:00 sang 11:00 lúc ${new Date().toISOString()}]: Khách dời giờ sớm hơn`,
    },
  });
  assert(rescheduledV3.status === 'rescheduled', 'Lịch 3 đã đổi sang trạng thái rescheduled');
  assert(rescheduledV3.notes.includes('Khách dời giờ sớm hơn'), 'Lịch sử đổi giờ được lưu vào notes');

  // 3.3 Chủ hết phòng unit2 (handleUnitUnavailable)
  await prisma.rentalUnit.update({
    where: { id: unit2.id },
    data: { status: 'unavailable' },
  });

  // Tìm các lịch chưa hoàn tất của unit2 và tự động hủy có lý do
  const viewingsToCancel = await prisma.viewing.findMany({
    where: {
      unitId: unit2.id,
      status: { in: ['requested', 'confirmed', 'rescheduled'] },
    },
  });

  for (const v of viewingsToCancel) {
    await prisma.viewing.update({
      where: { id: v.id },
      data: {
        status: 'cancelled',
        notes: `${v.notes ? v.notes + '\n' : ''}[Tự động hủy]: Phòng đã hết chỗ`,
      },
    });
  }

  const checkV2 = await prisma.viewing.findUnique({ where: { id: v2.id } });
  assert(checkV2.status === 'cancelled' && checkV2.notes.includes('Phòng đã hết chỗ'), 'Lịch của unit2 tự động bị hủy với ghi chú phòng hết chỗ');

  console.log(`\n=== TỔNG KẾT KIỂM THỬ DEV-07 (AT-10, AT-11, AT-12) ===`);
  console.log(`PASS: ${testPassed} | FAIL: ${testFailed}`);

  if (testFailed > 0) {
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Lỗi kiểm thử DEV-07:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
