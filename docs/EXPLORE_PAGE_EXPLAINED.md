# อธิบายโค้ดหน้าหมวด "รวมคอร์ส" (Explore Page)

เอกสารนี้อธิบายโครงสร้างและ flow การทำงานของหน้า **รวมคอร์ส** (`/explore`) แบบย่อและเป็นขั้นตอน

---

## 1. โครงสร้างหน้าหมวดรวมคอร์ส (ภาพรวม)

```
┌─────────────────────────────────────────────────────────────┐
│  ExplorePage (export default)                               │
│  └── React.Suspense                                         │
│        └── MarketplaceContent                               │
│              ├── 1. Banner (BannerStrip หรือ placeholder)   │
│              ├── 2. QuickFilters (ทั้งหมด, ประถม, ม.ต้น...)  │
│              ├── 3. AdvancedFilterBar (วิชา, ระดับ, ราคา...) │
│              ├── 4. TutorHighlight (วงกลมติวเตอร์)           │
│              ├── 5. Active Filter Chips (กำลังกรอง: ...)    │
│              └── 6. CourseGridSection × N (แต่ละหมวด)       │
└─────────────────────────────────────────────────────────────┘
```

- **State หลัก** อยู่ที่ **URL** (query string) ผ่าน `useMarketplaceFilters`
- **QuickFilter** กับ **AdvancedFilter** ใช้ state เดียวกัน (root, category, level, ...) จึงทำงานสัมพันธ์กัน

---

## 2. แหล่งที่มาของ State: URL

Filter ทั้งหมดอ่านจาก **query string** ของ URL เช่น:

- `/explore` → ไม่กรอง
- `/explore?root=xxx` → เลือกหมวดหลัก (QuickFilter)
- `/explore?root=xxx&categoryId=yyy` → เลือกหมวดหลัก + วิชาย่อย
- `/explore?levelId=zzz&courseType=ONLINE_LIVE` → ระดับ + ประเภทคอร์ส

ดังนั้น **เมื่อเปลี่ยน filter = เปลี่ยน URL** และ **refresh หน้าหรือแชร์ลิงก์ จะได้ filter ชุดเดิม**

---

## 3. Hook หลัก: `useMarketplaceFilters`

**ไฟล์:** `apps/frontend/app/hooks/useMarketplaceFilters.ts`

### หน้าที่

- อ่าน state จาก URL ผ่าน `useSearchParams()`  
  เช่น `root`, `categoryId`, `levelId`, `tutorId`, `courseType`, `minPrice`, `maxPrice`, `search`
- ส่งฟังก์ชันสำหรับ **อัปเดต URL** เมื่อผู้ใช้เปลี่ยน filter (เช่น `setRootCategory`, `setCategory`, `setLevel`, ...)

### สิ่งที่ return (สรุป)

| ค่า | ความหมาย |
|-----|----------|
| `rootCategoryId`, `categoryId`, `levelId`, ... | ค่าจาก URL (string หรือ null) |
| `searchInput` | ค่าในช่องค้นหา (sync กับ `search` ใน URL) |
| `setRootCategory(id)` | ตั้ง `?root=id` และลบ `categoryId` |
| `setCategory(id)` | ตั้ง/ลบ `?categoryId=id` |
| `setLevel(id)` | ตั้ง/ลบ `?levelId=id` |
| `setCourseType`, `setPriceRange`, `toggleTutor`, `setSort`, `setSearch` | อัปเดต query อื่นๆ |
| `clearAll()` | กลับไป `/explore` (ลบทุก query) |

### การอัปเดต URL

- ใช้ `router.push(pathname + '?' + params)` (หรือ helper `updateParams` / `createQueryString`)
- **Search** ใช้ debounce 300ms ก่อนอัปเดต URL เพื่อไม่ให้กดทีละตัวอักษรแล้ว push บ่อยเกินไป

---

## 4. Optimistic State (ทำไมต้องมี)

ปัญหา: หลังเรียก `router.push(...)` บางครั้ง **Next.js ยังไม่อัปเดต `useSearchParams()` ทันที**  
ผลคือพอคลิก QuickFilter (เช่น IELTS) แล้ว `rootCategoryId` ยังเป็น `null` → ปุ่มไม่ highlight และรายวิชาไม่เปลี่ยน

### วิธีแก้: Optimistic state

ใน `MarketplaceContent`:

```ts
const [optimisticRootId, setOptimisticRootId] = useState<string | null>(null);
const effectiveRootCategoryId = rootCategoryId ?? optimisticRootId;
```

- **เมื่อผู้ใช้คลิก QuickFilter (เช่น IELTS)**  
  - เรียก `setOptimisticRootId(id)` ทันที → UI ใช้ `effectiveRootCategoryId` อัปเดตทันที (ปุ่มสีส้ม, รายวิชาใน AdvancedFilter, sections)
  - พร้อมกันเรียก `setRootCategory(id)` เพื่ออัปเดต URL
- **เมื่อ URL อัปเดตแล้ว** (`rootCategoryId` จาก URL ไม่เป็น null)  
  - ใช้ `useEffect` เคลียร์: `setOptimisticRootId(null)`  
  - หลังจากนั้น state จริงจะมาจาก URL อย่างเดียว

ดังนั้น **effectiveRootCategoryId** คือ “หมวดหลักที่ใช้แสดงผลจริง” (จาก URL หรือจาก optimistic) ใช้ทั้งใน QuickFilter, AdvancedFilter และการตัดสินใจว่าแสดง sections ไหน

---

## 5. Hook: `useQuickFilter`

**ไฟล์:** `apps/frontend/app/hooks/useQuickFilter.ts`

### หน้าที่

- รับ `categories` (จาก API) และ `rootCategoryId` (ที่ส่งเป็น **effectiveRootCategoryId** จากหน้า explore)
- คำนวณ:
  - **rootCategories** = หมวดหลัก (ไม่มี parent)
  - **childCategories** = หมวดย่อยของ root ที่เลือก
  - **activeFilterLabel** = ชื่อปุ่มที่ควร highlight (เช่น "IELTS", "ทั้งหมด")
- ส่ง **handleQuickFilterChange(label)** สำหรับเมื่อผู้ใช้คลิกปุ่ม QuickFilter

### การจับคู่ปุ่ม → หมวด

- ปุ่ม "ทั้งหมด" → `onRootCategoryChange(null)` (ล้าง root)
- ปุ่มอื่น (เช่น "IELTS") → หา root category จาก **ชื่อ** (`c.name === label`) หรือจาก **slug** (`QUICK_FILTER_SLUG_MAP`) แล้วเรียก `onRootCategoryChange(found.id)` และล้าง category/level

ดังนั้น **QuickFilter** ไม่ได้เก็บ state เอง แค่ส่ง “ชื่อปุ่มที่คลิก” เข้า hook แล้ว hook แปลงเป็น `rootCategoryId` แล้วส่งไปอัปเดต URL (และ optimistic) ที่หน้า explore

---

## 6. หน้าหมวดรวมคอร์ส (explore) ทำอะไรบ้าง

**ไฟล์:** `apps/frontend/app/(public)/explore/page.tsx`

### 6.1 โหลดข้อมูลครั้งแรก

- ใน `useEffect` (รันครั้งเดียวเมื่อ mount):
  - ดึง banners (EXPLORE_TOP, EXPLORE_MIDDLE), categories, levels
  - ดึง courses จำนวนหนึ่งเพื่อ **ดึงรายชื่อ tutors** มาแสดงใน TutorHighlight
- เก็บใน state: `topBanners`, `middleBanners`, `categories`, `levels`, `tutors`, `loading`

### 6.2 การใช้ effectiveRootCategoryId

- ส่ง **effectiveRootCategoryId** (ไม่ใช่แค่ `rootCategoryId`) เข้า `useQuickFilter`  
  → ทำให้เมื่อคลิก QuickFilter แล้ว UI อัปเดตทันทีแม้ URL ยังไม่ sync
- ตอนคลิก QuickFilter เรียก:
  - `setOptimisticRootId(id)` (ให้ UI ใช้ค่าทันที)
  - `setRootCategory(id)` (อัปเดต URL)

### 6.3 การตัดสินใจว่า “แสดง sections อะไร”

`sectionsToShow` (useMemo) กำหนดว่าหน้าจะแสดง **กี่ section** และ **แต่ละ section คือหมวดไหน**:

| กรณี | ผลลัพธ์ |
|------|---------|
| มี `categoryId` (เลือกวิชาใน AdvancedFilter) | แสดงแค่ 1 หมวด = หมวดนั้น |
| มี `effectiveRootCategoryId` และมี child | แสดงเฉพาะ **child categories** ของ root นั้น |
| มี `effectiveRootCategoryId` แต่ไม่มี child | แสดง root นั้น + root อื่นๆ |
| ไม่มี root เลือก (“ทั้งหมด”) | แสดงทุก **rootCategories** |

แต่ละ section คือหนึ่ง `<CourseGridSection>` ที่รับ `title={cat.name}`, `categoryId={cat.id}` และ filter อื่นๆ (level, tutor, ราคา, search) ไปด้วย

### 6.4 ส่งต่อ filter ไปยัง AdvancedFilter และ CourseGrid

- **AdvancedFilterBar**  
  - ได้รับ `subjectCategories={childCategories}` → dropdown “วิชา” จะเป็นรายวิชาตาม QuickFilter ที่เลือก  
  - ได้รับ `categoryId`, `levelId`, `courseType`, ราคา, search และ callback สำหรับเปลี่ยนค่า (ซึ่งไปอัปเดต URL ผ่าน `useMarketplaceFilters`)
- **CourseGridSection (แต่ละ section)**  
  - ได้รับ `categoryId={cat.id}`, `levelId`, `tutorId`, `courseType`, `minPrice`, `maxPrice`, `search`  
  - ใช้ค่านี้เรียก API คอร์สและแสดงผล

ดังนั้น **ทั้ง QuickFilter, AdvancedFilter และ CourseGrid ใช้ชุด filter ชุดเดียวกันจาก URL (+ optimistic สำหรับ root)**

---

## 7. คอมโพเนนต์ย่อย

### 7.1 QuickFilters

**ไฟล์:** `apps/frontend/app/components/marketplace/QuickFilters.tsx`

- แสดงปุ่ม: ทั้งหมด, ประถม, ม.ต้น, ม.ปลาย, TCAS, SAT, IELTS
- รองรับ:
  - **Mobile:** flex wrap
  - **Desktop:** แถวเดียว + ปุ่มเลื่อนซ้าย/ขวา
- เมื่อคลิกปุ่ม → เรียก `onFilterChange(filter)` (= `handleQuickFilterChange` จาก useQuickFilter)
- ปุ่มที่ active ได้จาก `activeFilter` (= `activeFilterLabel` จาก useQuickFilter)
- `disabled={!quickFilterReady || loading}` → กันคลิกก่อนโหลด categories เสร็จ

### 7.2 AdvancedFilterBar

**ไฟล์:** `apps/frontend/app/components/marketplace/AdvancedFilterBar.tsx`

- Dropdown / input: วิชา, ระดับ, รูปแบบ, ช่วงราคา, ช่องค้นหา
- **วิชา** = `subjectCategories` (จาก `childCategories` ของ useQuickFilter) → เลือกได้เฉพาะวิชาในหมวดที่ QuickFilter เลือก
- ทุกการเปลี่ยนจะเรียก callback ที่ผูกกับ `setCategory`, `setLevel`, `setCourseType`, `setPriceRange`, `setSearch` ใน useMarketplaceFilters → อัปเดต URL

### 7.3 CourseGridSection

**ไฟล์:** `apps/frontend/app/components/marketplace/CourseGridSection.tsx`

- รับ `title`, `categoryId`, `levelId`, `tutorId`, `courseType`, `minPrice`, `maxPrice`, `search`, `initialLimit`
- ใน `useEffect` เรียก `courseApi.getMarketplace({ categoryId, levelId, ... })` ตาม props
- แสดงผล:
  - **Mobile:** แถวเดียวเลื่อนแนวนอน (single row)
  - **Desktop:** grid หลายคอลัมน์
- ปุ่ม “ดูทั้งหมด” / “ย่อลง” → สลับ `isExpanded`; ตอนขยายจะ fetch ใหม่ด้วย `limit` ใหญ่ (เช่น 1000) เพื่อแสดงคอร์สทั้งหมดใน section นั้นบนหน้าเดียวกัน (ไม่ไปหน้าอื่น)

---

## 8. Flow สรุป (เมื่อผู้ใช้คลิก QuickFilter “IELTS”)

1. ผู้ใช้คลิกปุ่ม "IELTS" ใน QuickFilters  
   → `handleFilterClick("IELTS")` → `onFilterChange("IELTS")` = `handleQuickFilterChange("IELTS")`
2. **useQuickFilter**  
   - หา root category ชื่อ "IELTS" (หรือ slug "ielts")  
   - เรียก `onRootCategoryChange(found.id)` (และล้าง category/level)
3. **explore page**  
   - `onRootCategoryChange` ที่ส่งเข้า useQuickFilter คือฟังก์ชันที่:
     - เรียก `setOptimisticRootId(id)` → `effectiveRootCategoryId` เปลี่ยนทันที
     - เรียก `setRootCategory(id)` → อัปเดต URL
4. **useMarketplaceFilters**  
   - `setRootCategory(id)` → `updateParams({ root: id, categoryId: null })` → `router.push(...)`
5. **การ re-render**  
   - `effectiveRootCategoryId` = id (จาก optimistic หรือจาก URL ภายหลัง)
   - **useQuickFilter** ได้ `rootCategoryId = effectiveRootCategoryId` → `activeFilterLabel` = "IELTS", `childCategories` = วิชาในหมวด IELTS
   - QuickFilters ได้ `activeFilter="IELTS"` → ปุ่ม IELTS เป็นสีส้ม
   - AdvancedFilterBar ได้ `subjectCategories={childCategories}` → dropdown วิชาเป็นรายวิชา IELTS
   - `sectionsToShow` = childCategories ของ IELTS → แสดงหลาย section ตามหมวดย่อย
   - แต่ละ CourseGridSection ได้ `categoryId` ของหมวดย่อย → โหลดคอร์สตามหมวด + filter อื่นๆ

---

## 9. สรุปสั้นๆ

- **State หลัก = URL** (ใช้ผ่าน useMarketplaceFilters)
- **Optimistic state** ทำให้คลิก QuickFilter แล้ว UI เปลี่ยนทันทีแม้ URL ยังไม่อัปเดต
- **useQuickFilter** แปลง “ปุ่มที่คลิก” เป็น root category และคำนวณ child + label สำหรับ QuickFilter และ AdvancedFilter
- **QuickFilters** = ปุ่มหมวดหลัก; **AdvancedFilterBar** = วิชา (child) + ระดับ + ประเภท + ราคา + ค้นหา
- **CourseGridSection** โหลดคอร์สจาก API ตาม `categoryId` และ filter อื่นๆ ที่ส่งมาจากหน้า explore

ถ้าต้องการเจาะไฟล์ใดเป็นบรรทัดต่อบรรทัด บอกชื่อไฟล์หรือส่วน (เช่น “แค่ useMarketplaceFilters” หรือ “แค่ CourseGridSection”) ได้เลย
