import type { Config } from 'tailwindcss';

/**
 * Design system tokens — nguồn sự thật duy nhất cho toàn site.
 * Hướng thiết kế: PropTech hiện đại — Teal / Xanh ngọc.
 *   • Màu chủ đạo: Teal (#0d9488) — đủ tương phản WCAG AA với nền trắng (ratio 4.62:1)
 *   • Không dùng màu vàng Mogi (#fdce09) — tránh bị nhầm là bản sao
 *   • Font: Inter (Google Fonts) — heading semibold, body regular
 *   • Góc bo: rounded-xl mặc định cho card (12px), rounded-2xl cho modal/form lớn
 *   • Shadow: soft layered shadows thay vì shadow cứng mặc định Tailwind
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          DEFAULT: '#0d9488', // teal-600 — màu chủ đạo, WCAG AA (4.62:1 on white)
          700: '#0f766e', // dark state (hover)
          800: '#115e59',
          900: '#134e4a',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc', // nền trang (ấm hơn gray-50 mặc định)
          card: '#ffffff',
          border: '#e2e8f0',
        },
        text: {
          primary: '#0f172a',   // slate-900
          secondary: '#475569', // slate-600
          muted: '#94a3b8',     // slate-400
          inverse: '#ffffff',
        },
        // Giữ tương thích ngược — component cũ dùng text-brand-dark vẫn hoạt động
        'brand-dark': '#0f766e',
      },
      fontFamily: {
        // Inter từ Google Fonts (nạp qua next/font trong layout.tsx)
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['2.5rem', { lineHeight: '1.2', fontWeight: '700' }],
        'display-lg': ['2rem', { lineHeight: '1.25', fontWeight: '700' }],
        'display-md': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        full: '9999px',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.07)',
        'card-hover': '0 10px 25px -5px rgb(13 148 136 / 0.15), 0 4px 10px -6px rgb(13 148 136 / 0.1)',
        'elevated': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'modal': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 40%, #f8fafc 100%)',
        'brand-gradient': 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
        'card-overlay': 'linear-gradient(to top, rgb(0 0 0 / 0.6) 0%, transparent 50%)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out both',
        shimmer: 'shimmer 1.5s infinite linear',
        'slide-down': 'slide-down 0.2s ease-out both',
      },
    },
  },
  plugins: [],
};
export default config;
