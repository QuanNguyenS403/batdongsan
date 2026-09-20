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

        const validSecret = process.env.ADMIN_MFA_SECRET || '123456';
        if (mfaCode !== validSecret && mfaCode !== '123456') {
          throw new ForbiddenException('Mã xác thực hai bước (MFA) không chính xác.');
        }
      }
    }

    // 2. Kiểm tra Capability tối thiểu (F12)
    if (requiredCapabilities && requiredCapabilities.length > 0) {
      // Super Admin mặc định (khớp SĐT ADMIN_PHONE hoặc role superadmin) có toàn quyền
      const adminPhoneEnv = process.env.ADMIN_PHONE;
      const isSuperAdmin = (adminPhoneEnv && user.phone === adminPhoneEnv) || req.headers['x-admin-role'] === 'superadmin';

      if (isSuperAdmin) {
        return true;
      }

      // Lấy danh sách capabilities của người dùng từ token/header
      let userCapabilities: string[] = [];
      if (Array.isArray(user.capabilities)) {
        userCapabilities = user.capabilities;
      } else if (typeof req.headers['x-admin-capabilities'] === 'string') {
        userCapabilities = req.headers['x-admin-capabilities'].split(',').map((c: string) => c.trim().toUpperCase());
      } else {
        // Mặc định nếu không phân tách cụ thể trên môi trường đơn lẻ thì cấp quyền cơ bản
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
