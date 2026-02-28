# TODO: Rotate Production Database Credentials

> ⚠️ Production password (`npg_lpom7AxCtEN9`) เคยถูก commit เข้า git history แล้ว (commits: 6fb7526, a6937ef)
> ควรทำให้เร็วที่สุด

## ขั้นตอน

### 1. Reset password บน Neon Dashboard

- ไปที่ https://console.neon.tech
- Project → **Roles** (เมนูซ้าย)
- `neondb_owner` → **Reset password** → Copy password ใหม่

### 2. อัพเดท GitHub Repository Secrets

- GitHub repo → **Settings → Secrets and variables → Actions**
- อัพเดท `DATABASE_URL`:
  ```
  postgresql://neondb_owner:<NEW_PASSWORD>@ep-restless-king-a145ypws-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
  ```
- อัพเดท `DIRECT_URL`:
  ```
  postgresql://neondb_owner:<NEW_PASSWORD>@ep-restless-king-a145ypws.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
  ```

### 3. อัพเดท `packages/db/.env` ของตัวเอง

เปลี่ยน password ใน `DATABASE_URL` และ `DIRECT_URL` เป็น password ใหม่

### 4. แจ้งทีม

ให้ทุกคนในทีม update `.env` ของตัวเองด้วย (ขอ URL ใหม่จากคุณ)
