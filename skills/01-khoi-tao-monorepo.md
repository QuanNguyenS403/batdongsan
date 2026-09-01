# Skill 01 — Khởi tạo Monorepo

## Mục tiêu
Dựng khung thư mục monorepo (pnpm workspaces + Turborepo) đúng theo cấu trúc đã chốt trong `README.md § 12`, sẵn sàng để các skill sau thêm code vào.

## Điều kiện tiên quyết
- Node.js ≥ 20, pnpm ≥ 9 đã cài trên máy (agent kiểm tra bằng `node -v` và `pnpm -v`; nếu thiếu, hướng dẫn người dùng cài, không tự ý cài global qua sudo).
- Git repo đã tồn tại (đã có `CLAUDE.md`, `README.md`, `.gitignore`).

## Các bước thực hiện

### Bước 1 — Tạo cấu trúc thư mục gốc
```bash
mkdir -p apps/web apps/api apps/worker
mkdir -p packages/database packages/types packages/utils packages/ui
mkdir -p infra/docker infra/ci-cd
mkdir -p docs
```

### Bước 2 — File cấu hình workspace gốc
Tạo `pnpm-workspace.yaml`:
```yaml
packages:
  - "apps/*"
  - "packages/*"
```

Tạo `package.json` gốc:
```json
{
  "name": "batdongsan-monorepo",
  "private": true,
  "scripts": {
    "dev": "turbo run dev --parallel",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "test": "turbo run test"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.5.0",
    "prettier": "^3.3.0",
    "eslint": "^9.0.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

Tạo `turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "dev": { "cache": false, "persistent": true },
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**", ".next/**"] },
    "lint": {},
    "test": {}
  }
}
```

### Bước 3 — Cấu hình dùng chung
- `tsconfig.base.json` ở gốc (strict mode bật):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  }
}
```
- `.editorconfig`, `.prettierrc` (2 spaces, singleQuote true, semi true), `.eslintrc` gốc kế thừa cho các app.

### Bước 4 — `.env.example` ở gốc repo
```
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/batdongsan

# Redis
REDIS_URL=redis://localhost:6379

# Meilisearch
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=masterKey

# Auth
JWT_SECRET=changeme
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# SMS OTP
SMS_PROVIDER=esms
SMS_API_KEY=
SMS_SECRET_KEY=

# Storage
S3_ENDPOINT=
S3_REGION=auto
S3_BUCKET=batdongsan-images
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_PUBLIC_URL=

# Payment
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_RETURN_URL=http://localhost:3000/payment/callback

# Maps
GOONG_MAPS_API_KEY=

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:4000
API_PORT=4000
```

### Bước 5 — `docker-compose.yml` cho hạ tầng local
Tạo tại gốc repo (tham chiếu `README.md § 10`):
```yaml
services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: batdongsan
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  meilisearch:
    image: getmeili/meilisearch:v1.9
    environment:
      MEILI_MASTER_KEY: masterKey
      MEILI_ENV: development
    ports: ["7700:7700"]
    volumes: ["meilidata:/meili_data"]

volumes:
  pgdata:
  meilidata:
```

### Bước 6 — README.md dev instructions
Cập nhật (không ghi đè) mục "Cài đặt & chạy local" trong `README.md` gốc nếu lệnh thực tế khác với bản nháp ban đầu.

## Kiểm thử nhanh
```bash
docker compose up -d
docker compose ps          # cả 3 service phải "healthy"/"running"
pnpm install                # phải chạy không lỗi dù chưa có app con
```

## Definition of Done
- [ ] Cấu trúc thư mục khớp `README.md § 12`.
- [ ] `pnpm install` chạy được ở gốc không lỗi.
- [ ] `docker compose up -d` khởi động được Postgres (có PostGIS) + Redis + Meilisearch.
- [ ] `.env.example` đầy đủ biến, `.env` thật đã được thêm vào `.gitignore`.
- [ ] Cập nhật `memory-bank/progress.md`: skill 01 → ✅ Xong.
