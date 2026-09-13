import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillFinanceLedgers() {
  console.log('--- BẮT ĐẦU BACKFILL SỔ CÁI TÀI CHÍNH (FIN-02) ---');

  const activeMemberships = await prisma.userMembership.findMany({
    where: {
      status: 'active',
      pricePaid: { gt: 0 },
    },
    include: {
      financeLedgers: true,
    },
  });

  let backfilledCount = 0;
  for (const m of activeMemberships) {
    if (m.financeLedgers.length === 0) {
      const extTxId = m.externalTransactionId || `BACKFILL_MB_${m.id.toString()}`;
      await prisma.financeLedger.create({
        data: {
          transactionType: 'cash_in',
          amount: m.pricePaid,
          userMembershipId: m.id,
          userId: m.userId,
          externalTransactionId: extTxId,
          note: `Backfill ledger record for active membership #${m.id.toString()}`,
          createdAt: m.approvedAt || m.createdAt,
        },
      });
      backfilledCount++;
      console.log(`  + Đã tạo ledger cho UserMembership #${m.id.toString()}: ${m.pricePaid.toString()} VNĐ`);
    }
  }

  console.log(`--- HOÀN THÀNH: Đã backfill ${backfilledCount} bản ghi sổ cái ---`);
}

backfillFinanceLedgers()
  .catch((e) => {
    console.error('Lỗi backfill ledger:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
