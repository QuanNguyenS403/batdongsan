import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@batdongsan/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isConnected = false;
  private reconnectInterval: NodeJS.Timeout | null = null;

  async onModuleInit() {
    await this.testConnection();
    // Tự động thử kết nối lại mỗi 20s nếu DB chưa bật
    this.reconnectInterval = setInterval(() => {
      if (!this.isConnected) {
        this.testConnection().catch(() => {});
      }
    }, 20000);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.$connect();
      this.isConnected = true;
      this.logger.log('Đã kết nối cơ sở dữ liệu PostgreSQL thành công.');
      return true;
    } catch (err) {
      this.isConnected = false;
      this.logger.warn(`Chưa thể kết nối tới cơ sở dữ liệu PostgreSQL: ${(err as Error).message}. Endpoint /health sẽ báo trạng thái 503.`);
      return false;
    }
  }

  async onModuleDestroy() {
    if (this.reconnectInterval) clearInterval(this.reconnectInterval);
    await this.$disconnect();
  }
}
