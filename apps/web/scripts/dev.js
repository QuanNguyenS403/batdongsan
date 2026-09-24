const { spawn, exec } = require('child_process');
const path = require('path');

// Tìm đường dẫn thực tế của binary next để chạy trực tiếp qua Node.js — loại bỏ overhead của npx và shell
let nextBin;
try {
  nextBin = require.resolve('next/dist/bin/next');
} catch {
  nextBin = path.join(__dirname, '..', 'node_modules', 'next', 'dist', 'bin', 'next');
}

// Khởi chạy Next.js với Turbopack (--turbo) bằng chính tiến trình Node hiện tại
const child = spawn(process.execPath, [nextBin, 'dev', '--turbo'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  env: process.env,
});

let browserOpened = false;

function openBrowser(url) {
  if (browserOpened) return;
  browserOpened = true;
  console.log(`\n🚀 Đang tự động mở trình duyệt tới ${url}...`);

  const startCmd = process.platform === 'win32'
    ? `powershell -NoProfile -Command "Start-Process '${url}'"`
    : process.platform === 'darwin'
    ? `open "${url}"`
    : `xdg-open "${url}"`;

  exec(startCmd, (err) => {
    if (err && process.platform === 'win32') {
      exec(`start "" "${url}"`);
    }
  });
}

function handleOutput(data) {
  const text = data.toString();
  process.stdout.write(text);

  // Bắt chuỗi địa chỉ URL khi dev server sẵn sàng (VD: - Local: http://localhost:3000 hoặc http://localhost:3001)
  const match = text.match(/Local:\s+(https?:\/\/[^\s]+)/i) || text.match(/(https?:\/\/localhost:\d+)/i);
  if (match && !browserOpened) {
    const url = match[1];
    setTimeout(() => openBrowser(url), 400);
  }
}

child.stdout.on('data', handleOutput);
child.stderr.on('data', (data) => {
  process.stderr.write(data);
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});

process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
