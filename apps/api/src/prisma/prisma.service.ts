import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@batdongsan/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Đã kết nối cơ sở dữ liệu PostgreSQL thành công.');
    } catch (err) {
      this.logger.warn(`Chưa thể kết nối tới cơ sở dữ liệu PostgreSQL: ${(err as Error).message}. Endpoint /health sẽ báo trạng thái 503.`);
    }
  }
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
