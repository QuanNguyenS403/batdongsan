import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HTTP_ERROR');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

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

    const timestamp = new Date().toISOString();

    // GHI LOG CÓ CẤU TRÚC (STRUCTURED LOGGING):
    // Đảm bảo không nuốt chửng lỗi 500 hay unhandled exceptions ở production
    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const errorDetails = {
        level: 'error',
        method: request.method,
        url: request.url,
        ip: request.ip,
        statusCode: status,
        error: exception instanceof Error ? exception.message : String(exception),
        timestamp,
      };
      this.logger.error(
        JSON.stringify(errorDetails),
        exception instanceof Error ? exception.stack : undefined,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} -> ${status} | ${Array.isArray(message) ? message.join('; ') : message}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      timestamp,
    });
  }
}

