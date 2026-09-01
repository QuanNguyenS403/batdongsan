export function Footer() {
  return (
    <footer className="mt-16 border-t bg-white py-10 text-sm text-gray-500">
      <div className="mx-auto max-w-6xl px-4">
        <p className="font-semibold text-gray-700">BatDongSan.demo</p>
        <p className="mt-2 max-w-2xl">
          Đây là bản MVP kỹ thuật đang trong giai đoạn phát triển. Toàn bộ tin đăng bất động sản hiển thị
          (nếu có) là dữ liệu mẫu dùng để kiểm tra giao diện, chưa phải dữ liệu thật của khách hàng.
        </p>
        <p className="mt-4">© {new Date().getFullYear()} — Dự án nội bộ, chưa phát hành chính thức.</p>
      </div>
    </footer>
  );
}
