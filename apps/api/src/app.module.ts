import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerModule } from '@nestjs/throttler';
import { join } from 'path';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { LocationsModule } from './modules/locations/locations.module';
import { ListingsModule } from './modules/listings/listings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // QUAN TRỌNG: đây là app con trong monorepo (chạy với cwd = apps/api), nhưng file .env
      // thật lại đặt ở GỐC monorepo. Nếu chỉ để mặc định, ConfigModule chỉ tìm ".env" trong cwd
      // hiện tại (apps/api/.env) và sẽ ÂM THẦM bỏ qua toàn bộ .env gốc — mọi secret/API key sẽ
      // rơi về giá trị fallback cứng trong code, cực kỳ nguy hiểm khi lên production.
      // Thứ tự ưu tiên: .env riêng của apps/api (nếu có) > .env gốc monorepo.
      envFilePath: [join(__dirname, '..', '.env'), join(__dirname, '..', '..', '..', '.env')],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    LocationsModule,
    ListingsModule,
  ],
})
export class AppModule {}

