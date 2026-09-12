const fs = require('fs');
const path = require('path');

const envPath = path.resolve(__dirname, '../../../.env');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const apiNodeModules = path.resolve(__dirname, '../../../apps/api/node_modules');
const rootNodeModules = path.resolve(__dirname, '../../../node_modules');
module.paths.unshift(apiNodeModules, rootNodeModules);

const { JwtService } = require('@nestjs/jwt');
const bcrypt = require('bcryptjs');

const { AuthService } = require('../../../apps/api/dist/modules/auth/auth.service');
const { OtpService } = require('../../../apps/api/dist/modules/auth/otp.service');
const { EmailService } = require('../../../apps/api/dist/modules/email/email.service');

// In-memory Prisma mock store để test AuthService thật mà không cần daemon Postgres bên ngoài
class InMemoryUserStore {
  constructor() {
    this.users = new Map();
    this.nextId = 1n;
  }

  async findUnique({ where }) {
    if (where.phone) {
      for (const u of this.users.values()) {
        if (u.phone === where.phone) return { ...u };
      }
      return null;
    }
    if (where.id !== undefined) {
      const u = this.users.get(BigInt(where.id));
      return u ? { ...u } : null;
    }
    return null;
  }

  async create({ data }) {
    const id = this.nextId++;
    const record = {
      id,
      phone: data.phone,
      fullName: data.fullName ?? null,
      passwordHash: data.passwordHash,
      role: data.role ?? 'user',
      avatarUrl: data.avatarUrl ?? null,
      isBlocked: data.isBlocked ?? false,
      isPhoneVerified: data.isPhoneVerified ?? false,
      createdAt: new Date(),
    };
    this.users.set(id, record);
    return { ...record };
  }

  async update({ where, data }) {
    const id = BigInt(where.id);
    const existing = this.users.get(id);
    if (!existing) throw new Error(`User not found with id ${id}`);
    const updated = {
      ...existing,
      ...data,
    };
    this.users.set(id, updated);
    return { ...updated };
  }

  async deleteMany({ where }) {
    if (where && where.phone && where.phone.in) {
      for (const [id, u] of Array.from(this.users.entries())) {
        if (where.phone.in.includes(u.phone)) {
          this.users.delete(id);
        }
      }
    }
    return { count: 0 };
  }
}

const mockPrisma = {
  user: new InMemoryUserStore(),
  $disconnect: async () => {},
};
const prisma = mockPrisma;

const jwtService = new JwtService();
const otpService = new OtpService();
const authService = new AuthService(mockPrisma, otpService, jwtService);

async function runWave0Verification() {
  console.log('===============================================================');
  console.log('🚀 BẮT ĐẦU KIỂM THỬ NGHIỆM THU WAVE 0 THEO TIÊU CHÍ AUDIT');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (detail) console.error(`     Chi tiết: ${detail}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST GROUP 1: P0-01 — Đảm bảo credential cũ không thể login hoặc tự động nâng quyền
  // ---------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: P0-01 Triệt tiêu Backdoor Credential Cố định ---');

  // Xóa user test nếu có từ trước
  await prisma.user.deleteMany({
    where: { phone: { in: ['0981753082', '0999999991', '0999999992'] } },
  });

  // 1.1 Thử đăng nhập bằng backdoor cũ trên tài khoản chưa tồn tại
  let backdoorFailed = false;
  try {
    await authService.login({
      phone: '0981753082',
      password: 'Quannguyenkay6@',
    });
  } catch (err) {
    backdoorFailed = err.status === 401 || (err.message && err.message.includes('không đúng'));
  }
  assert(backdoorFailed, 'P0-01.1: Login bằng credential cũ (0981753082 / Quannguyenkay6@) bị từ chối 401');

  const userAfterBackdoor = await prisma.user.findUnique({ where: { phone: '0981753082' } });
  assert(userAfterBackdoor === null, 'P0-01.2: Login cũ không tự động tạo user hoặc nâng quyền trong database');

  // 1.2 Tạo user thường với mật khẩu khác, thử login bằng mật khẩu backdoor
  const normalUserPassword = await bcrypt.hash('NormalPassword@123', 10);
  const normalUser = await prisma.user.create({
    data: {
      phone: '0999999991',
      fullName: 'User Thường Test',
      passwordHash: normalUserPassword,
      role: 'user',
      isPhoneVerified: true,
    },
  });

  let normalUserBackdoorFailed = false;
  try {
    await authService.login({
      phone: '0999999991',
      password: 'Quannguyenkay6@',
    });
  } catch (err) {
    normalUserBackdoorFailed = err.status === 401;
  }
  assert(normalUserBackdoorFailed, 'P0-01.3: User thường không thể login bằng mật khẩu backdoor cũ');

  // Kiểm tra role của user thường không bị đổi thành admin
  const userCheckRole = await prisma.user.findUnique({ where: { id: normalUser.id } });
  assert(userCheckRole && userCheckRole.role === 'user', 'P0-01.4: Role của user thường vẫn giữ nguyên "user", không bị leo thang đặc quyền');

  // 1.3 Đổi mật khẩu hợp lệ: mật khẩu mới hoạt động, mật khẩu cũ không còn tác dụng
  const newHashed = await bcrypt.hash('NewPassword@456', 10);
  await prisma.user.update({
    where: { id: normalUser.id },
    data: { passwordHash: newHashed },
  });

  const loginWithNewPass = await authService.login({
    phone: '0999999991',
    password: 'NewPassword@456',
  });
  assert(!!loginWithNewPass.accessToken, 'P0-01.5: Đổi mật khẩu thành công, đăng nhập mật khẩu mới nhận được JWT');

  let oldPasswordFails = false;
  try {
    await authService.login({
      phone: '0999999991',
      password: 'NormalPassword@123',
    });
  } catch (err) {
    oldPasswordFails = err.status === 401;
  }
  assert(oldPasswordFails, 'P0-01.6: Mật khẩu cũ bị từ chối sau khi đổi mật khẩu');

  // 1.4 Kiểm tra tài khoản bị khóa (isBlocked)
  await prisma.user.update({
    where: { id: normalUser.id },
    data: { isBlocked: true },
  });
  let blockedLoginFails = false;
  try {
    await authService.login({
      phone: '0999999991',
      password: 'NewPassword@456',
    });
  } catch (err) {
    blockedLoginFails = err.status === 401 && err.message && err.message.includes('khóa');
  }
  assert(blockedLoginFails, 'P0-01.7: Tài khoản bị khóa (isBlocked=true) bị từ chối đăng nhập');

  // ---------------------------------------------------------------------------
  // TEST GROUP 2: Cơ chế Bootstrap Admin An toàn qua Secret ngoài repo
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Bootstrap Admin An Toàn qua Biến Môi Trường ---');

  process.env.ADMIN_BOOTSTRAP_SECRET = 'super_secret_test_token_min_16_chars';

  // 2.1 Thử bootstrap với secret sai
  let wrongSecretFails = false;
  try {
    await authService.bootstrapAdmin({
      secret: 'wrong_secret_12345678',
      phone: '0999999992',
      password: 'AdminSecurePass@123',
    });
  } catch (err) {
    wrongSecretFails = err.status === 401;
  }
  assert(wrongSecretFails, 'Bootstrap 2.1: Bootstrap với sai secret bị từ chối 401');

  // 2.2 Bootstrap với secret đúng
  const bootstrapSuccess = await authService.bootstrapAdmin({
    secret: 'super_secret_test_token_min_16_chars',
    phone: '0999999992',
    password: 'AdminSecurePass@123',
    fullName: 'Admin Thật Test',
  });
  assert(bootstrapSuccess.user.role === 'admin', 'Bootstrap 2.2: Bootstrap thành công cấp role="admin" cho SĐT cấu hình');

  // 2.3 Login với tài khoản admin vừa bootstrap
  const adminLogin = await authService.login({
    phone: '0999999992',
    password: 'AdminSecurePass@123',
  });
  assert(adminLogin.user.role === 'admin' && !!adminLogin.accessToken, 'Bootstrap 2.3: Admin bootstrap đăng nhập bình thường với role="admin"');

  // ---------------------------------------------------------------------------
  // TEST GROUP 3: Safety Net Môi Trường Staging (Không gửi SMS / Email thật)
  // ---------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Safety Net Môi Trường Staging ---');

  process.env.APP_ENV = 'staging';
  process.env.SAFETY_NET_DISABLE_OUTBOUND = 'true';

  const stagingEmailService = new EmailService();
  assert(stagingEmailService.isMock === true, 'Safety Net 3.1: EmailService tự động cưỡng chế isMock=true trên môi trường Staging');

  // Dọn dẹp dữ liệu test
  await prisma.user.deleteMany({
    where: { phone: { in: ['0999999991', '0999999992'] } },
  });

  console.log('\n===============================================================');
  console.log(`KẾT QUẢ KIỂM THỬ WAVE 0: ${passed} PASS, ${failed} FAIL`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runWave0Verification()
  .catch((err) => {
    console.error('Lỗi khi chạy kiểm thử:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
