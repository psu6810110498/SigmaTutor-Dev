# สรุปฟีเจอร์ทั้งหมด — SigmaTutor-Dev

เอกสารนี้อธิบายฟีเจอร์ที่มีในโปรเจกต์ปัจจุบัน (หลัง merge main ล่าสุด)

---

## 1. หน้าสาธารณะ (Public)

| ฟีเจอร์ | เส้นทาง | คำอธิบาย |
|--------|---------|----------|
| **หน้าแรก** | `/` | โฮมเพจ: Hero, สถิติ, หมวดหมู่, คอร์สยอดนิยม |
| **รวมคอร์ส (Explore)** | `/explore` | หน้ารวมคอร์ส: แบนเนอร์, QuickFilter (ทั้งหมด/ประถม/ม.ต้น/ม.ปลาย/TCAS/SAT/IELTS), AdvancedFilter (วิชา/ระดับ/รูปแบบ/ราคา/ค้นหา), Tutor Highlight, CourseGrid แยกตามหมวด |
| **หมวดตาม slug** | `/explore/category/[slug]` | หน้ารายการคอร์สตามหมวด (slug) |
| **หน้ารายละเอียดคอร์ส** | `/course/[id]` | แสดงข้อมูลคอร์ส, ราคา, สารบัญ, รีวิว, ปุ่มลงตะกร้า/ซื้อ |
| **หน้ารีวิวคอร์ส** | `/course/reviews` | รายการรีวิว (อาจใช้ query หรือ context) |
| **ตะกร้าสินค้า** | `/cart` | แสดงรายการในตะกร้า, ปุ่มไปชำระเงิน |
| **ชำระเงิน (Checkout)** | `/checkout` | หน้า checkout (Stripe), สร้าง session ชำระเงิน |
| **ชำระเงินสำเร็จ** | `/checkout/success` | หลังชำระเงินสำเร็จ |
| **ชำระเงินยกเลิก** | `/checkout/cancel` | หลังยกเลิก checkout |
| **เกี่ยวกับเรา** | `/about` | หน้าเกี่ยวกับเรา |
| **ติดต่อเรา** | `/contact` | หน้าติดต่อเรา |

---

## 2. การลงทะเบียนและเข้าสู่ระบบ (Auth)

| ฟีเจอร์ | เส้นทาง | คำอธิบาย |
|--------|---------|----------|
| **ลงทะเบียน** | `/register` | สมัครสมาชิก (อีเมล/รหัสผ่าน) |
| **เข้าสู่ระบบ** | `/login` | ล็อกอินด้วยอีเมล/รหัสผ่าน |
| **ล็อกอินด้วย Google** | Backend: `GET /api/auth/google` | OAuth Google → redirect กลับ + set cookie |
| **ล็อกอินสำเร็จ** | `/login-success` | หลังล็อกอิน (รวม Google) |
| **ลืมรหัสผ่าน** | `/forgot-password` | ขอรีเซ็ตรหัสผ่าน (ส่งลิงก์/อีเมล) |
| **รีเซ็ตรหัสผ่าน** | `/reset-password` | ตั้งรหัสผ่านใหม่ด้วย token |

---

## 3. ผู้เรียน (Learner)

| ฟีเจอร์ | เส้นทาง | คำอธิบาย |
|--------|---------|----------|
| **แดชบอร์ด** | `/dashboard` | หน้าหลักหลังล็อกอิน (ผู้เรียน) |
| **คอร์สของฉัน** | `/my-courses` | รายการคอร์สที่ลงทะเบียนแล้ว |
| **คอร์สของฉัน (ในแดชบอร์ด)** | `/dashboard/my-courses` | รายการคอร์สในแดชบอร์ด |
| **โปรไฟล์** | `/profile` | แก้ไขโปรไฟล์ผู้ใช้ |
| **ตั้งค่า** | `/dashboard/settings` | ตั้งค่าบัญชี (learner) |

---

## 4. แอดมิน (Admin)

| ฟีเจอร์ | เส้นทาง | คำอธิบาย |
|--------|---------|----------|
| **แดชบอร์ดแอดมิน** | `/admin` | ภาพรวม: คอร์ส, นักเรียน, รายได้, ยอดเข้าชม (รอเชื่อมข้อมูลจริง) |
| **จัดการคอร์ส** | `/admin/courses` | รายการคอร์สทั้งหมด, สร้าง/แก้ไข/ลบ |
| **สร้างคอร์ส** | `/admin/courses/create` | ฟอร์มสร้างคอร์ส: หมวด, ระดับ, ราคา, รูปแบบ (Online/Live/Onsite), ตารางเรียน, Zoom/Map ฯลฯ |
| **แก้ไขคอร์ส** | `/admin/courses/[id]/edit` | แก้ไขคอร์ส (Overview, Curriculum, Schedule แยกแท็บ) |
| **จัดการแบนเนอร์** | `/admin/marketing/banners` | สร้าง/แก้ไข/ลบแบนเนอร์ (ตำแหน่ง EXPLORE_TOP ฯลฯ) |
| **คำสั่งซื้อ** | `/admin/orders` | รายการคำสั่งซื้อ |
| **การชำระเงิน** | `/admin/payments` | รายการชำระเงิน |
| **นักเรียน** | `/admin/students` | จัดการนักเรียน |
| **ครู/ติวเตอร์** | `/admin/teachers` | จัดการครู/ติวเตอร์ |
| **ผู้ใช้** | `/admin/users` | จัดการผู้ใช้ |
| **ตั้งค่า** | `/admin/settings` | ตั้งค่าแอดมิน |

---

## 5. ฟีเจอร์ด้านเทคนิค (Frontend)

| ฟีเจอร์ | รายละเอียด |
|--------|-------------|
| **Filter ตาม URL** | หน้า Explore ใช้ query string (?root=, categoryId=, levelId=, …) เป็น state หลัก |
| **Optimistic UI (QuickFilter)** | คลิก QuickFilter แล้ว UI อัปเดตทันที (ไม่รอ URL sync) |
| **ตะกร้า + วิชลิสต์** | CourseContext: addToCart, removeFromCart, addToWishlist, removeFromWishlist, เก็บใน localStorage |
| **Auth Context** | เก็บ user, login, logout, checkAuth (cookie-based) |
| **API Caching** | cache GET บาง endpoint (categories, levels, marketplace, banners) ลด request ซ้ำ |
| **Responsive** | Mobile: QuickFilter แบบ wrap, CourseGrid เลื่อนแนวนอน; Desktop: แถวเดียว + grid |

---

## 6. Backend API (สรุป)

| กลุ่ม | Endpoint หลัก | ฟีเจอร์ |
|------|----------------|---------|
| **Auth** | `/api/auth/*` | register, login, logout, forgot-password, reset-password, refresh, /me, Google OAuth |
| **Users** | `/api/users/*` | รายการผู้ใช้, แก้ไขโปรไฟล์, ลบ ฯลฯ |
| **Categories** | `/api/categories` | list, create, update, delete |
| **Levels** | `/api/levels` | list, create, update, delete |
| **Courses** | `/api/courses/*` | marketplace, enrolled, admin list, getById, getBySlug, create, update, delete, upload ฯลฯ |
| **Chapters** | `/api/courses/:id/chapters` | create, update, delete |
| **Lessons** | `/api/courses/.../lessons` | create, update, delete |
| **Schedules** | `/api/courses/.../schedules` | create, update, delete |
| **Reviews** | `/api/reviews` | list, create, update, delete |
| **Payments** | `/api/payments/*` | create-checkout-session (Stripe), webhook |
| **Banners** | `/api/banners` | getActive, list (admin), create, update, delete |
| **Upload** | `/api/upload/*` | profile image, image upload |

---

## 7. ฐานข้อมูล (Prisma)

- **User** (role: ADMIN, INSTRUCTOR, LEARNER), โปรไฟล์, รูป
- **Category** (parentId สำหรับหมวดย่อย)
- **Level**
- **Course** (หมวด, ระดับ, ผู้สอน, ราคา, สถานะ, รูป)
- **Chapter** / **Lesson** (หลักสูตร)
- **CourseSchedule** (ตารางเรียน)
- **Review** ( rating, comment )
- **Banner** (position: EXPLORE_TOP, EXPLORE_MIDDLE, HOME_TOP ฯลฯ)
- **Promotion** (ถ้ามี)
- การชำระเงิน/คำสั่งซื้อ (เชื่อมกับ Stripe)

---

## 8. สรุปสั้น ๆ

- **สาธารณะ:** หน้าแรก, รวมคอร์ส (filter ตาม URL + QuickFilter + AdvancedFilter), รายละเอียดคอร์ส, รีวิว, ตะกร้า, Checkout (Stripe), เกี่ยวกับเรา, ติดต่อเรา  
- **Auth:** ลงทะเบียน, ล็อกอิน, ล็อกอินด้วย Google, ลืม/รีเซ็ตรหัสผ่าน  
- **ผู้เรียน:** แดชบอร์ด, คอร์สของฉัน, โปรไฟล์, ตั้งค่า  
- **แอดมิน:** แดชบอร์ด, คอร์ส (สร้าง/แก้ไข/ลบ), แบนเนอร์, คำสั่งซื้อ, การชำระเงิน, นักเรียน, ครู, ผู้ใช้, ตั้งค่า  
- **Backend:** REST API สำหรับ auth, users, categories, levels, courses (รวม chapter/lesson/schedule), reviews, payments (Stripe), banners, upload  
- **Frontend:** Filter ตาม URL, Optimistic QuickFilter, ตะกร้า/วิชลิสต์, Auth context, API cache, responsive layout  

ถ้าต้องการรายละเอียดเฉพาะส่วนใด (เช่น แค่ Explore หรือแค่ Admin) บอกได้เลยว่าจะให้ขยายส่วนไหน
