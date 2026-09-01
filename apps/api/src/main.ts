import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
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

  const config = new DocumentBuilder()
    .setTitle('Batdongsan API')
    .setDescription('API cho nền tảng rao vặt bất động sản')
    .setVersion('0.1')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.API_PORT ?? 4000;
  await app.listen(port);
  console.log(`🚀 API đang chạy tại http://localhost:${port}`);
  console.log(`📘 Swagger docs tại http://localhost:${port}/docs`);
}
bootstrap();

