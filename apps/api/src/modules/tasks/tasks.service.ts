import { Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { ListingStatus } from '@batdongsan/database';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpService } from '../auth/otp.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class TasksService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(TasksService.name);
  private timer: NodeJS.Timeout | null = null;
  // Chu kỳ quét mặc định: mỗi 10 phút (600.000 ms)
  private readonly SWEEP_INTERVAL_MS = 10 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly otpService: OtpService,
    private readonly emailService: EmailService,
  ) {}

  onApplicationBootstrap() {
    this.logger.log('Khởi chạy hệ thống tác vụ nền định kỳ (TasksService)...');
    // Chạy lượt quét khởi động sau 10 giây
    setTimeout(() => {
      void this.runPeriodicTasks();
    }, 10_000);

    // Lên lịch lặp lại định kỳ
    this.timer = setInterval(() => {
      void this.runPeriodicTasks();
    }, this.SWEEP_INTERVAL_MS);
  }

  onApplicationShutdown() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      this.logger.log('Đã dừng hệ thống tác vụ nền định kỳ.');
    }
  }

  /**
   * Thực thi chuỗi tác vụ định kỳ
   */
  async runPeriodicTasks(): Promise<{ expiredCount: number; cleanedOtpCount: number }> {
    try {
      const expiredCount = await this.expirePastDueListings();
      const cleanedOtpCount = this.sweepExpiredOtps();
      return { expiredCount, cleanedOtpCount };
    } catch (err) {
      this.logger.error('Lỗi khi thực thi tác vụ nền định kỳ:', (err as Error).stack);
      return { expiredCount: 0, cleanedOtpCount: 0 };
    }
  }

  /**
   * Quét và tự động chuyển trạng thái tin đăng hết hạn (expiresAt < now) sang 'expired',
   * đồng thời gửi email thông báo cho chủ trọ.
   */
  async expirePastDueListings(): Promise<number> {
    const now = new Date();
    
    // Tìm các tin cần chuyển trạng thái kèm thông tin liên hệ chủ nhà
    const expiredCandidates = await this.prisma.listing.findMany({
      where: {
        status: ListingStatus.active,
        expiresAt: {
          not: null,
          lt: now,
        },
      },
      select: {
        id: true,
        title: true,
        owner: { select: { phone: true } },
      },
      take: 100, // giới hạn mỗi batch
    });

    if (expiredCandidates.length === 0) {
      return 0;
    }

    const candidateIds = expiredCandidates.map((c) => c.id);
    const result = await this.prisma.listing.updateMany({
      where: {
        id: { in: candidateIds },
        status: ListingStatus.active,
      },
      data: {
        status: ListingStatus.expired,
      },
    });

    if (result.count > 0) {
      this.logger.log(
        `[Tin hết hạn] Đã tự động chuyển ${result.count} tin đăng quá hạn sang trạng thái '${ListingStatus.expired}'.`,
      );

      // Gửi thông báo an toàn cho chủ trọ
      for (const item of expiredCandidates) {
        try {
          void this.emailService.sendListingExpiredToLandlord(item, item.owner.phone);
        } catch {
          // safe-fail
        }
      }
    }
    return result.count;
  }

  /**
   * Dọn dẹp mã OTP đã hết hạn trong bộ nhớ
   */
  sweepExpiredOtps(): number {
    const count = this.otpService.cleanupExpired();
    if (count > 0) {
      this.logger.log(`[Dọn dẹp OTP] Đã giải phóng ${count} mã OTP hết hạn khỏi bộ nhớ.`);
    }
    return count;
  }
}

