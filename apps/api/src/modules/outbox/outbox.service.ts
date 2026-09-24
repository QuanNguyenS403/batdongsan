import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { GoogleSheetsService } from '../google-sheets/google-sheets.service';
import { OutboxStatus } from '@batdongsan/database';

export interface CreateOutboxEventParams {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: any;
}

export type OutboxDispatchResult = 'SENT' | 'SKIPPED' | 'RETRYABLE_FAILURE';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private isLocalProcessing = false;
  private readonly workerId = `worker-${process.pid}-${Math.random().toString(36).substring(2, 9)}`;
  private readonly LEASE_DURATION_MS = 5 * 60 * 1000; // 5 phút

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}

  /**
   * Ghi sự kiện vào bảng Outbox để thực thi bất đồng bộ an toàn (Transactional Outbox - OPS-03 / BE-12 / RB-06)
   */
  async recordEvent(params: CreateOutboxEventParams, tx?: any): Promise<any> {
    const client = tx ?? this.prisma;
    try {
      const event = await client.outboxEvent.create({
        data: {
          aggregateType: params.aggregateType,
          aggregateId: String(params.aggregateId),
          eventType: params.eventType,
          payload: params.payload,
          status: OutboxStatus.PENDING,
          retryCount: 0,
          maxRetries: 5,
          nextRetryAt: new Date(),
        },
      });
      return event;
    } catch (err: any) {
      this.logger.error(`[Outbox] Không thể tạo outbox event ${params.eventType}: ${err.message}`);
      throw err;
    }
  }

  /**
   * Quét và xử lý các sự kiện đang chờ (PENDING) hoặc bị treo (PROCESSING quá hạn lease)
   * RB-07: Cơ chế Lease & Reclaim chống stuck processing vĩnh viễn
   * RB-08: Loại bỏ fallback in-memory khi advisory lock query lỗi
   * RB-15: Phân định rõ 3 trạng thái SENT / SKIPPED / RETRYABLE_FAILURE
   */
  async processPendingBatch(batchSize = 20): Promise<{ processed: number; completed: number; failed: number }> {
    if (this.isLocalProcessing) {
      return { processed: 0, completed: 0, failed: 0 };
    }

    this.isLocalProcessing = true;
    let hasAdvisoryLock = false;

    try {
      // PostgreSQL distributed advisory lock chống tranh chấp giữa nhiều worker/node (RB-08)
      try {
        const lockRes: any = await this.prisma.$queryRawUnsafe(
          `SELECT pg_try_advisory_lock(hashtext('outbox_worker_lock')) as locked;`,
        );
        hasAdvisoryLock = Boolean(lockRes?.[0]?.locked);
        if (!hasAdvisoryLock) {
          this.logger.debug('[Outbox] Worker khác đang nắm distributed lock, bỏ qua lượt quét này.');
          return { processed: 0, completed: 0, failed: 0 };
        }
      } catch (lockErr: any) {
        // RB-08: Tuyệt đối không fallback in-memory khi DB lỗi raw query; abort an toàn
        this.logger.warn(`[Outbox] Không thể kiểm tra advisory lock DB: ${lockErr.message}. Bỏ qua chu kỳ quét để bảo vệ tính nhất quán.`);
        return { processed: 0, completed: 0, failed: 0 };
      }

      const now = new Date();
      // RB-07: Tìm cả events PENDING đến hạn và events PROCESSING đã hết hạn khóa lease (worker cũ bị crash/treo)
      const claimableEvents = await this.prisma.outboxEvent.findMany({
        where: {
          OR: [
            {
              status: OutboxStatus.PENDING,
              nextRetryAt: { lte: now },
            },
            {
              status: OutboxStatus.PROCESSING,
              lockedUntil: { lt: now },
            },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: batchSize,
      });

      if (claimableEvents.length === 0) {
        return { processed: 0, completed: 0, failed: 0 };
      }

      // RB-07: Lease batch events với workerId và lockedUntil
      const eventIds = claimableEvents.map((e) => e.id);
      const lockedUntil = new Date(Date.now() + this.LEASE_DURATION_MS);
      await this.prisma.outboxEvent.updateMany({
        where: {
          id: { in: eventIds },
          OR: [
            { status: OutboxStatus.PENDING },
            { status: OutboxStatus.PROCESSING, lockedUntil: { lt: now } },
          ],
        },
        data: {
          status: OutboxStatus.PROCESSING,
          workerId: this.workerId,
          lockedUntil,
        },
      });

      let completedCount = 0;
      let failedCount = 0;

      for (const event of claimableEvents) {
        try {
          const dispatchResult = await this.dispatchEvent(event);

          if (dispatchResult === 'SENT' || dispatchResult === 'SKIPPED') {
            await this.prisma.outboxEvent.update({
              where: { id: event.id },
              data: {
                status: OutboxStatus.COMPLETED,
                processedAt: new Date(),
                errorMessage: dispatchResult === 'SKIPPED' ? 'SKIPPED: Sự kiện không yêu cầu gửi thông báo ra ngoài' : null,
                lockedUntil: null,
              },
            });
            completedCount++;
          } else {
            // RETRYABLE_FAILURE
            throw new Error(`Handler trả về RETRYABLE_FAILURE cho sự kiện ${event.eventType}`);
          }
        } catch (dispatchErr: any) {
          const nextRetryCount = event.retryCount + 1;
          const isDeadLetter = nextRetryCount >= event.maxRetries;
          const backoffDelayMs = Math.min(Math.pow(2, nextRetryCount) * 2000, 3600_000); // Tối đa 1h
          const nextRetryDate = new Date(Date.now() + backoffDelayMs);

          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: isDeadLetter ? OutboxStatus.FAILED : OutboxStatus.PENDING,
              retryCount: nextRetryCount,
              nextRetryAt: nextRetryDate,
              errorMessage: dispatchErr?.message ?? 'Lỗi không xác định khi dispatch event',
              processedAt: isDeadLetter ? new Date() : null,
              lockedUntil: null,
            },
          });

          if (isDeadLetter) {
            failedCount++;
            this.logger.error(
              `[Outbox DLQ] Sự kiện #${event.id} (${event.eventType}) đã vượt quá số lần retry tối đa (${event.maxRetries}). Chuyển vào FAILED (DLQ): ${dispatchErr.message}`,
            );
          } else {
            this.logger.warn(
              `[Outbox Retry] Sự kiện #${event.id} (${event.eventType}) thất bại lần ${nextRetryCount}/${event.maxRetries}. Sẽ thử lại lúc ${nextRetryDate.toISOString()}: ${dispatchErr.message}`,
            );
          }
        }
      }

      return {
        processed: claimableEvents.length,
        completed: completedCount,
        failed: failedCount,
      };
    } catch (err: any) {
      this.logger.error(`[Outbox] Lỗi trong chu kỳ processPendingBatch: ${err.message}`);
      return { processed: 0, completed: 0, failed: 0 };
    } finally {
      if (hasAdvisoryLock) {
        try {
          await this.prisma.$queryRawUnsafe(
            `SELECT pg_advisory_unlock(hashtext('outbox_worker_lock'));`,
          );
        } catch {
          // safe-fail
        }
      }
      this.isLocalProcessing = false;
    }
  }

  /**
   * Điều phối thực thi nghiệp vụ thông báo (Email / Sheets)
   * RB-15: Phân định rõ 3 trạng thái: SENT | SKIPPED | RETRYABLE_FAILURE
   */
  private async dispatchEvent(event: any): Promise<OutboxDispatchResult> {
    const payload = event.payload;

    switch (event.eventType) {
      case 'EMAIL_LISTING_SUBMITTED':
        await this.emailService.sendListingSubmittedToLandlord(payload.listing, payload.landlordPhone, payload.landlordEmail);
        return 'SENT';

      case 'EMAIL_LISTING_APPROVED':
        await this.emailService.sendListingApprovedToLandlord(payload.listing, payload.landlordPhone, payload.landlordEmail);
        return 'SENT';

      case 'EMAIL_LISTING_REJECTED':
        await this.emailService.sendListingRejectedToLandlord(payload.listing, payload.landlordPhone, payload.reason, payload.landlordEmail);
        return 'SENT';

      case 'EMAIL_NEW_LISTING_ADMIN':
        await this.emailService.sendNewListingToAdmin(payload.listing);
        return 'SENT';

      case 'EMAIL_NEW_REPORT_ADMIN':
        await this.emailService.sendNewReportToAdmin(payload.report);
        return 'SENT';

      case 'EMAIL_LISTING_EXPIRED':
        await this.emailService.sendListingExpiredToLandlord(payload.listing, payload.landlordPhone, payload.landlordEmail);
        return 'SENT';

      case 'EMAIL_MEMBERSHIP_UPGRADE_ADMIN':
        await this.emailService.sendMembershipUpgradeRequestToAdmin(payload.request);
        return 'SENT';

      case 'EMAIL_MEMBERSHIP_ACTIVATED_USER':
        await this.emailService.sendMembershipActivatedToUser(payload.membership, payload.userEmail);
        return 'SENT';

      case 'LEAD_CREATED':
        // RB-13: Thông báo khách thuê quan tâm tới chủ tin đăng
        this.logger.log(`[Outbox] Thông báo Lead #${payload.leadId} cho chủ tin ${payload.landlordPhone}: ${payload.tenantName} - ${payload.tenantPhone}`);
        return 'SENT';

      case 'VIEWING_REQUESTED':
        this.logger.log(`[Outbox] Yêu cầu lịch xem mới #${payload.viewingId} từ khách ${payload.clientName} (${payload.clientPhone}) cho phòng ${payload.unitCode}`);
        return 'SENT';

      case 'VIEWING_CONFIRMED':
        this.logger.log(`[Outbox] Lịch xem #${payload.viewingId} đã xác nhận: Mã checkin ${payload.checkinCode}, người dẫn ${payload.agentName} (${payload.agentPhone})`);
        return 'SENT';

      case 'COMMISSION_DUE':
        this.logger.log(`[Outbox] Công nợ hoa hồng đến hạn cho Deal #${payload.dealCode}: ${payload.amountVnd}đ, hạn thanh toán ${payload.dueAt}`);
        return 'SENT';

      case 'COMMISSION_PAID':
        this.logger.log(`[Outbox] Thu phí hoa hồng thành công Deal #${payload.dealCode}: ${payload.amountVnd}đ qua giao dịch ${payload.externalBankTxId}`);
        return 'SENT';

      case 'SHEETS_PENDING_LISTING':
        const ok = await this.googleSheetsService.appendPendingListing(payload.listing);
        if (!ok && !this.googleSheetsService.isMock) {
          return 'RETRYABLE_FAILURE';
        }
        return 'SENT';

      case 'SHEETS_VIOLATION_REPORT':
        const reportOk = await this.googleSheetsService.appendViolationReport(payload.report);
        if (!reportOk && !this.googleSheetsService.isMock) {
          return 'RETRYABLE_FAILURE';
        }
        return 'SENT';

      default:
        this.logger.warn(`[Outbox] Bỏ qua sự kiện không có handler: ${event.eventType}`);
        return 'SKIPPED';
    }
  }

  /**
   * Lấy danh sách các sự kiện rơi vào Dead Letter Queue (FAILED) để Admin rà soát
   */
  async getDlqEvents(page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const [total, events] = await Promise.all([
      this.prisma.outboxEvent.count({ where: { status: OutboxStatus.FAILED } }),
      this.prisma.outboxEvent.findMany({
        where: { status: OutboxStatus.FAILED },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);

    return {
      total,
      page,
      pageSize,
      events: events.map((e) => ({
        ...e,
        id: e.id.toString(),
      })),
    };
  }

  /**
   * Thử lại thủ công một sự kiện trong Dead Letter Queue
   */
  async retryDlqEvent(id: bigint | string): Promise<boolean> {
    const eventId = BigInt(id);
    const existing = await this.prisma.outboxEvent.findUnique({
      where: { id: eventId },
    });

    if (!existing || existing.status !== OutboxStatus.FAILED) {
      return false;
    }

    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxStatus.PENDING,
        retryCount: 0,
        nextRetryAt: new Date(),
        errorMessage: null,
      },
    });

    return true;
  }
}
