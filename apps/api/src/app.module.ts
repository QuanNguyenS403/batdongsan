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
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // QUAN TRỌNG: hỗ trợ đọc .env.production hoặc .env ở gốc monorepo và apps/api
      envFilePath: [
        join(__dirname, '..', `.env.${process.env.NODE_ENV ?? 'development'}`),
        join(__dirname, '..', '.env'),
        join(__dirname, '..', '..', '..', `.env.${process.env.NODE_ENV ?? 'development'}`),
        join(__dirname, '..', '..', '..', '.env'),
      ],
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
    HealthModule,
  ],
})
export class AppModule {}

