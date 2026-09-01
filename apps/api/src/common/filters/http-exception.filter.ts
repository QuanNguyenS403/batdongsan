import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    let message: string | string[] = 'Đã có lỗi xảy ra, vui lòng thử lại sau.';
    if (exception instanceof HttpException) {
      const body = exception.getResponse();
      // ValidationPipe (class-validator) ném ra object dạng { statusCode, message: string[], error }
      // — lấy thẳng field message bên trong thay vì lồng nguyên object vào message ở tầng ngoài,
      // tránh FE phải đoán response.message.message thay vì response.message.
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null && 'message' in body) {
        message = (body as { message: string | string[] }).message;
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}

