import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#fdce09', // màu chủ đạo tham khảo phong cách các sàn BĐS VN, đổi tuỳ thương hiệu thật
          dark: '#e0b400',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
