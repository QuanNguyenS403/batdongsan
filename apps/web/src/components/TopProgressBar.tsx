'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

export function TopProgressBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  const timersRef = useRef<NodeJS.Timeout[]>([]);

  function clearAllTimers() {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }

  // Khi URL thay đổi, trang đã hoàn tất tải: kết thúc mượt mà và ẩn đi
  useEffect(() => {
    // Luôn xóa sạch các timer đang chờ nâng progress
    clearAllTimers();

    // Trượt nhanh tới 100%
    setProgress(100);

    // Sau khi thanh trượt chạm 100% (200ms), ẩn thanh trượt
    const tEnd = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 250);

    timersRef.current.push(tEnd);

    return () => clearAllTimers();
  }, [pathname]);

  // Lắng nghe click vào link nội bộ để kích hoạt progress
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest('a');
      if (!target) return;

      const href = target.getAttribute('href');
      if (
        !href ||
        href.startsWith('#') ||
        href.startsWith('tel:') ||
        href.startsWith('mailto:') ||
        href.startsWith('javascript:') ||
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        target.target === '_blank' ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey
      ) {
        return;
      }

      // Nếu click vào chính URL hiện tại thì bỏ qua
      const currentPath = window.location.pathname + window.location.search;
      if (href === currentPath) return;

      // Xóa các timer cũ nếu có
      clearAllTimers();

      setVisible(true);
      setProgress(25);

      // Tăng dần theo nhịp mượt mà
      const t1 = setTimeout(() => setProgress(50), 100);
      const t2 = setTimeout(() => setProgress(75), 250);
      const t3 = setTimeout(() => setProgress(90), 500);

      // Fallback an toàn: nếu sau 1.5s không có sự kiện đổi URL thì tự động trượt hết và biến mất
      const tSafety = setTimeout(() => {
        setProgress(100);
        const tFade = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 200);
        timersRef.current.push(tFade);
      }, 1500);

      timersRef.current.push(t1, t2, t3, tSafety);
    }

    document.addEventListener('click', handleClick, { capture: true });
    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      clearAllTimers();
    };
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-0 top-0 z-[99999] h-[3px] w-full overflow-hidden bg-transparent"
    >
      <div
        className="h-full bg-gradient-to-r from-teal-500 via-teal-400 to-emerald-300 shadow-[0_0_10px_rgba(20,184,166,0.8)] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: 'width, opacity',
          transitionDuration: progress === 100 ? '200ms' : '180ms',
        }}
      />
    </div>
  );
}
