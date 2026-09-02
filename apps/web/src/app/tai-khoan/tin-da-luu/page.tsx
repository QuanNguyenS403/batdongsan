'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isLoggedIn } from '@/lib/auth-client';
import { ComingSoonNotice } from '@/components/ComingSoonNotice';

/**
 * "BĐS đã lưu" — module backend SavedListing (bảng saved_listings trong CLAUDE.md § 2.3) CHƯA
 * được triển khai (chưa có module nào trong apps/api/src/modules/ liên quan lưu tin). Trang này
 * chỉ sửa lỗi ĐIỀU HƯỚNG (Header trỏ tới đây nhưng route không tồn tại → 404), không giả vờ đã
 * có tính năng lưu tin thật. Vẫn yêu cầu đăng nhập trước khi xem, đúng UX của khu vực /tai-khoan.
 */
export default function TinDaLuuPage() {
  const router = useRouter();
  const [checkedAuth, setCheckedAuth] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/dang-nhap');
      return;
    }
    setCheckedAuth(true);
  }, [router]);

  if (!checkedAuth) return null;

  return (
    <ComingSoonNotice
      title="Bất động sản đã lưu"
      description="Danh sách các tin đăng bạn đã bấm lưu để xem lại sau — cần bảng saved_listings và nút Lưu tin ở trang chi tiết (chưa triển khai)."
    />
  );
}
