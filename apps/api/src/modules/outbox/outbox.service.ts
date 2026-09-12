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

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);
  private isLocalProcessing = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly googleSheetsService: GoogleSheetsService,
  ) {}

  /**
   * Ghi sự kiện vào bảng Outbox để thực thi bất đồng bộ an toàn (Transactional Outbox - OPS-03 / BE-12)
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
   * Quét và xử lý các sự kiện đang chờ (PENDING) với Distributed Lock & Exponential Backoff
   */
  async processPendingBatch(batchSize = 20): Promise<{ processed: number; completed: number; failed: number }> {
    if (this.isLocalProcessing) {
      return { processed: 0, completed: 0, failed: 0 };
    }

    this.isLocalProcessing = true;
    let hasAdvisoryLock = false;

    try {
      // Thử lấy PostgreSQL distributed advisory lock chống tranh chấp giữa nhiều worker/node
      try {
        const lockRes: any = await this.prisma.$queryRawUnsafe(
          `SELECT pg_try_advisory_lock(hashtext('outbox_worker_lock')) as locked;`,
        );
        hasAdvisoryLock = Boolean(lockRes?.[0]?.locked);
        if (!hasAdvisoryLock) {
          this.logger.debug('[Outbox] Worker khác đang nắm distributed lock, bỏ qua lượt quét này.');
          return { processed: 0, completed: 0, failed: 0 };
        }
      } catch {
        // Fallback in-memory lock nếu DB không hỗ trợ raw query hoặc mock environment
        hasAdvisoryLock = true;
      }

      const now = new Date();
      const pendingEvents = await this.prisma.outboxEvent.findMany({
        where: {
          status: OutboxStatus.PENDING,
          nextRetryAt: { lte: now },
        },
        orderBy: { createdAt: 'asc' },
        take: batchSize,
      });

      if (pendingEvents.length === 0) {
        return { processed: 0, completed: 0, failed: 0 };
      }

      // Đổi status sang PROCESSING
      const eventIds = pendingEvents.map((e) => e.id);
      await this.prisma.outboxEvent.updateMany({
        where: { id: { in: eventIds }, status: OutboxStatus.PENDING },
        data: { status: OutboxStatus.PROCESSING },
      });

      let completedCount = 0;
      let failedCount = 0;

      for (const event of pendingEvents) {
        try {
          await this.dispatchEvent(event);
          
          await this.prisma.outboxEvent.update({
            where: { id: event.id },
            data: {
              status: OutboxStatus.COMPLETED,
              processedAt: new Date(),
              errorMessage: null,
            },
          });
          completedCount++;
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
        processed: pendingEvents.length,
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
   */
  private async dispatchEvent(event: any): Promise<void> {
    const payload = event.payload;

    switch (event.eventType) {
      case 'EMAIL_LISTING_SUBMITTED':
        await this.emailService.sendListingSubmittedToLandlord(payload.listing, payload.landlordPhone, payload.landlordEmail);
        break;

      case 'EMAIL_LISTING_APPROVED':
        await this.emailService.sendListingApprovedToLandlord(payload.listing, payload.landlordPhone, payload.landlordEmail);
        break;

      case 'EMAIL_LISTING_REJECTED':
        await this.emailService.sendListingRejectedToLandlord(payload.listing, payload.landlordPhone, payload.reason, payload.landlordEmail);
        break;

      case 'EMAIL_NEW_LISTING_ADMIN':
        await this.emailService.sendNewListingToAdmin(payload.listing);
        break;

      case 'EMAIL_NEW_REPORT_ADMIN':
        await this.emailService.sendNewReportToAdmin(payload.report);
        break;

      case 'EMAIL_LISTING_EXPIRED':
        await this.emailService.sendListingExpiredToLandlord(payload.listing, payload.landlordPhone, payload.landlordEmail);
        break;

      case 'EMAIL_MEMBERSHIP_UPGRADE_ADMIN':
        await this.emailService.sendMembershipUpgradeRequestToAdmin(payload.request);
        break;

      case 'EMAIL_MEMBERSHIP_ACTIVATED_USER':
        await this.emailService.sendMembershipActivatedToUser(payload.membership, payload.userEmail);
        break;

      case 'SHEETS_PENDING_LISTING':
        const ok = await this.googleSheetsService.appendPendingListing(payload.listing);
        if (!ok && !this.googleSheetsService.isMock) {
          throw new Error('Ghi Google Sheets thất bại');
        }
        break;

      case 'SHEETS_VIOLATION_REPORT':
        const reportOk = await this.googleSheetsService.appendViolationReport(payload.report);
        if (!reportOk && !this.googleSheetsService.isMock) {
          throw new Error('Ghi Google Sheets báo cáo vi phạm thất bại');
        }
        break;

      default:
        this.logger.warn(`[Outbox] Bỏ qua sự kiện không có handler: ${event.eventType}`);
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
