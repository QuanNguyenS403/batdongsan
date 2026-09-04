import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
/** Gán danh sách vai trò (ví dụ: 'admin', 'broker', 'user') được phép truy cập endpoint. */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
