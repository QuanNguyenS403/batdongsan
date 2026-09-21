import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminCapability, CAPABILITIES_KEY, REQUIRE_MFA_KEY } from '../decorators/capabilities.decorator';

@Injectable()
export class CapabilitiesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredCapabilities = this.reflector.getAllAndOverride<AdminCapability[]>(CAPABILITIES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requireMfa = this.reflector.getAllAndOverride<boolean>(REQUIRE_MFA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu không yêu cầu capability hoặc MFA thì cho qua
    if ((!requiredCapabilities || requiredCapabilities.length === 0) && !requireMfa) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Bạn không có quyền thực hiện thao tác quản trị này.');
    }

    // 1. Kiểm tra xác thực hai bước (MFA) nếu endpoint yêu cầu (F12)
    if (requireMfa) {
      const isMfaEnforced = process.env.ADMIN_MFA_ENFORCED === 'true';
      const mfaCode = req.headers['x-admin-mfa-code'] || req.headers['x-mfa-code'];

      if (isMfaEnforced) {
        if (!mfaCode) {
          throw new ForbiddenException(
            'Thao tác nhạy cảm yêu cầu xác thực hai bước (MFA). Vui lòng cung cấp mã x-admin-mfa-code hợp lệ.',
          );
        }

        const validSecret = process.env.ADMIN_MFA_SECRET;
        if (!validSecret) {
          throw new ForbiddenException(
            'Hệ thống chưa cấu hình ADMIN_MFA_SECRET. Vui lòng liên hệ quản trị viên cấp cao.',
          );
        }

        if (mfaCode !== validSecret) {
          throw new ForbiddenException('Mã xác thực hai bước (MFA) không chính xác.');
        }
      }
    }

    // 2. Kiểm tra Capability tối thiểu (F12)
    if (requiredCapabilities && requiredCapabilities.length > 0) {
      // Super Admin khớp SĐT ADMIN_PHONE hoặc ADMIN_BOOTSTRAP_PHONE có toàn quyền
      const adminPhoneEnv = process.env.ADMIN_PHONE || process.env.ADMIN_BOOTSTRAP_PHONE;
      const isSuperAdmin = Boolean(adminPhoneEnv && user.phone === adminPhoneEnv);

      if (isSuperAdmin) {
        return true;
      }

      // Lấy danh sách capabilities của người dùng từ context xác thực hoặc cấu hình máy chủ
      let userCapabilities: string[] = [];
      if (Array.isArray(user.capabilities)) {
        userCapabilities = user.capabilities;
      } else if (process.env.ADMIN_CAPABILITIES_CONFIG) {
        try {
          const config = JSON.parse(process.env.ADMIN_CAPABILITIES_CONFIG);
          if (config && Array.isArray(config[user.phone])) {
            userCapabilities = config[user.phone].map((c: string) => c.trim().toUpperCase());
          }
        } catch {
          // JSON parse fail -> không cấp quyền ngầm
        }
      } else if (!adminPhoneEnv) {
        // Môi trường dev cục bộ khi chưa cấu hình ADMIN_PHONE / ADMIN_CAPABILITIES_CONFIG
        userCapabilities = [
          AdminCapability.LISTINGS_MODERATE,
          AdminCapability.LEADS_SUPPORT,
          AdminCapability.FINANCE_MANAGE,
          AdminCapability.SYSTEM_ADMIN,
        ];
      }

      const hasRequiredCapability = requiredCapabilities.some((cap) => userCapabilities.includes(cap));

      if (!hasRequiredCapability) {
        throw new ForbiddenException(
          `Bạn không có quyền capability [${requiredCapabilities.join(', ')}] để thực hiện thao tác này. (F12 PERMISSION-MATRIX)`,
        );
      }
    }

    return true;
  }
}
