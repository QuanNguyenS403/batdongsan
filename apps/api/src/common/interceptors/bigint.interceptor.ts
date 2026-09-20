import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Đệ quy biến đổi mọi giá trị kiểu bigint thành string trong đối tượng hoặc mảng kết quả
 */
function serializeBigInt(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'bigint') {
    return obj.toString();
  }

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt);
  }

  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const serialized: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      serialized[key] = serializeBigInt(obj[key]);
    }
    return serialized;
  }

  return obj;
}

/**
 * RB-12: Global BigInt Interceptor — đảm bảo 100% endpoint API không bao giờ gặp lỗi
 * HTTP 500 "Do not know how to serialize a BigInt" khi trả về nested entities có kiểu BigInt.
 */
@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => serializeBigInt(data)));
  }
}
