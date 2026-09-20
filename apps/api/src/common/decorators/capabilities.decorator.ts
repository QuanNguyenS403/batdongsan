import { SetMetadata } from '@nestjs/common';

export enum AdminCapability {
  LISTINGS_MODERATE = 'LISTINGS_MODERATE', // Duyệt/từ chối/verify tin đăng, xử lý báo cáo vi phạm
  LEADS_SUPPORT = 'LEADS_SUPPORT',         // Quản lý khách quan tâm, phân công leads
  FINANCE_MANAGE = 'FINANCE_MANAGE',       // Duyệt gói thành viên, hoàn tiền, xem sổ cái tài chính
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',           // Quản trị người dùng, audit events, sweep tasks, outbox DLQ
}

export const CAPABILITIES_KEY = 'capabilities';
export const RequireCapabilities = (...capabilities: AdminCapability[]) =>
  SetMetadata(CAPABILITIES_KEY, capabilities);

export const REQUIRE_MFA_KEY = 'require_mfa';
export const RequireAdminMfa = () => SetMetadata(REQUIRE_MFA_KEY, true);
