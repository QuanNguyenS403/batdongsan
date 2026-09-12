import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  const secret = process.env.ADMIN_BOOTSTRAP_SECRET;
  const phone = process.env.ADMIN_BOOTSTRAP_PHONE;
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  const fullName = process.env.ADMIN_BOOTSTRAP_FULLNAME || 'Quản trị viên';

  if (!secret || secret.trim().length < 16) {
    console.error('❌ Lỗi: ADMIN_BOOTSTRAP_SECRET chưa được cấu hình hoặc ngắn hơn 16 ký tự.');
    console.error('Vui lòng thiết lập ADMIN_BOOTSTRAP_SECRET trong file .env trước khi chạy.');
    process.exit(1);
  }

  if (!phone || !/^0[3|5|7|8|9][0-9]{8}$/.test(phone)) {
    console.error('❌ Lỗi: ADMIN_BOOTSTRAP_PHONE không hợp lệ hoặc thiếu (cần 10 chữ số định dạng VN).');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('❌ Lỗi: ADMIN_BOOTSTRAP_PASSWORD chưa được cung cấp hoặc ngắn hơn 8 ký tự.');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const existing = await prisma.user.findUnique({ where: { phone } });

  let adminUser;
  if (!existing) {
    adminUser = await prisma.user.create({
      data: {
        phone,
        fullName,
        passwordHash,
        role: 'admin',
        isPhoneVerified: true,
      },
    });
    console.log(`✅ Đã tạo mới tài khoản quản trị viên: ${adminUser.phone} (${adminUser.fullName})`);
  } else {
    adminUser = await prisma.user.update({
      where: { id: existing.id },
      data: {
        role: 'admin',
        passwordHash,
        fullName: fullName || existing.fullName,
      },
    });
    console.log(`✅ Đã nâng quyền và cập nhật mật khẩu cho quản trị viên: ${adminUser.phone} (${adminUser.fullName})`);
  }

  console.log('🔒 Tài khoản admin đã sẵn sàng. Hãy xóa hoặc vô hiệu hóa ADMIN_BOOTSTRAP_SECRET khi không còn cần thiết.');
}

bootstrapAdmin()
  .catch((err) => {
    console.error('❌ Lỗi bootstrap admin:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
