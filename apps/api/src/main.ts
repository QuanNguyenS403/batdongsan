import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { assertRequiredSecrets } from './common/config/assert-env';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';

// RB-12: An toàn BigInt serialization cho toàn bộ JSON.stringify của Node/Express/NestJS
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  // BẮT BUỘC chạy đầu tiên, trước cả NestFactory.create() — xem giải thích đầy đủ về lỗ hổng
  // JWT secret mặc định (đã fix trong đợt audit 01/09/2026) tại common/config/assert-env.ts.
  assertRequiredSecrets();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Đã viết HttpExceptionFilter từ đầu nhưng SÓT bước đăng ký này — mọi lỗi 500 trước đây
  // sẽ trả nguyên stack trace mặc định của Nest ra ngoài (rò rỉ thông tin nội bộ), không theo
  // format {statusCode, message, timestamp} thống nhất mà frontend đang parse (data.message).
  app.useGlobalFilters(new HttpExceptionFilter());

  // RB-12: Đăng ký BigIntInterceptor toàn cục triệt tiêu lỗi 500 do nested BigInt
  app.useGlobalInterceptors(new BigIntInterceptor());

  // BẢO MẬT & VẬN HÀNH (#37): Chỉ bật Swagger docs ở môi trường development/staging.
  // Trong môi trường production (NODE_ENV=production), tắt hoàn toàn /docs để bảo vệ API surface.
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Batdongsan API')
      .setDescription('API cho nền tảng rao vặt bất động sản')
      .setVersion('0.1')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = process.env.API_PORT ?? 4000;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  await app.listen(port);

  console.log('\n=============================================================');
  console.log(`🌐 GIAO DIỆN WEBSITE:   ${siteUrl}`);
  console.log(`🚀 HỆ THỐNG API:        http://localhost:${port} (Tự động chuyển hướng về Web)`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📘 TÀI LIỆU SWAGGER:    http://localhost:${port}/docs`);
  }
  console.log('=============================================================\n');
}
bootstrap();

