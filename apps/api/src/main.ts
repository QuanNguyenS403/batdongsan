import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { assertRequiredSecrets } from './common/config/assert-env';

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
  await app.listen(port);
  console.log(`🚀 API đang chạy tại http://localhost:${port}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📘 Swagger docs tại http://localhost:${port}/docs`);
  }
}
bootstrap();

