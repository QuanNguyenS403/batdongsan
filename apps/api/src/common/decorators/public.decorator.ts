import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Đánh dấu route không cần JWT (mặc định toàn bộ API yêu cầu auth trừ khi gắn @Public()). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
