import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function backfillFinanceLedgers() {
  console.log('=== BẮT ĐẦU BACKFILL & KIỂM TOÁN SỔ CÁI TÀI CHÍNH (FIN-02) ===');
  console.log('Nguyên tắc: Tuyệt đối không tự điền mã chứng từ giả. Chỉ ghi nhận khi có bằng chứng thực tế.');

  const memberships = await prisma.userMembership.findMany({
    where: {
      status: 'active',
      OR: [
        { pricePaid: { gt: 0 } },
        { confirmedPaymentAmount: { gt: 0 } },
      ],
    },
    include: {
      financeLedgers: true,
      user: { select: { phone: true, fullName: true } },
    },
  });

  let backfilledCount = 0;
  let missingProofCount = 0;
  const missingProofIds: string[] = [];

  for (const m of memberships) {
    if (m.financeLedgers.length === 0) {
      const extTxId = m.externalTransactionId?.trim();

      if (!extTxId) {
        // FIN-02: Phát hiện bản ghi không đủ bằng chứng — không tự bịa ID chứng từ ngân hàng!
        missingProofCount++;
        missingProofIds.push(m.id.toString());
        console.warn(
          `  [⚠️ CẢNH BÁO KIỂM TOÁN - THIẾU BẰNG CHỨNG] Membership #${m.id.toString()} của User ${m.user.phone} (${m.user.fullName || 'N/A'}) có pricePaid=${m.pricePaid.toString()} nhưng KHÔNG CÓ externalTransactionId. Chuyển vào danh sách rà soát đối soát thủ công.`,
        );

        // Ghi nhận AuditEvent để kiểm soát rủi ro
        await prisma.auditEvent.create({
          data: {
            action: 'finance.missing_proof_detected',
            entityType: 'user_membership',
            entityId: m.id.toString(),
            beforeState: { pricePaid: m.pricePaid.toString(), status: m.status },
            afterState: { auditFlag: 'UNVERIFIED_PENDING_MANUAL_PROOF' },
            reason: 'Phát hiện bản ghi membership active lịch sử thiếu mã giao dịch ngân hàng thực tế (FIN-02)',
          },
        });
        continue;
      }

      const amountToRecord = m.confirmedPaymentAmount > 0 ? m.confirmedPaymentAmount : m.pricePaid;

      await prisma.financeLedger.create({
        data: {
          transactionType: 'cash_in',
          amount: amountToRecord,
          userMembershipId: m.id,
          userId: m.userId,
          externalTransactionId: extTxId,
          note: `Backfill ledger record từ chứng từ ngân hàng hợp lệ #${extTxId}`,
          createdAt: m.approvedAt || m.createdAt,
        },
      });
      backfilledCount++;
      console.log(`  + [✅ ĐÃ XÁC THỰC] Đã tạo ledger cho UserMembership #${m.id.toString()}: ${amountToRecord.toString()} VNĐ (Ref: ${extTxId})`);
    }
  }

  console.log('=== KẾT QUẢ KIỂM TOÁN & BACKFILL ===');
  console.log(`- Bản ghi đã đối soát & tạo Sổ cái thành công: ${backfilledCount}`);
  console.log(`- Bản ghi thiếu bằng chứng chuyển tiền ngân hàng: ${missingProofCount}`);
  if (missingProofIds.length > 0) {
    console.log(`- Danh sách ID cần đối soát thủ công: [${missingProofIds.join(', ')}]`);
  }
}

backfillFinanceLedgers()
  .catch((e) => {
    console.error('Lỗi backfill ledger:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
