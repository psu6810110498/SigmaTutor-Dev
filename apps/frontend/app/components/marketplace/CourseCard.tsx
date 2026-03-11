'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Star,
  CheckCircle2,
  Clock,
  GraduationCap,
  CalendarDays,
  ShoppingCart,
  Zap,
  ArrowRight,
  Monitor,
  Video,
  MapPin,
  BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';

import { Course, CourseInstructor, Instructor } from '@/app/lib/types';
import { useCourse, toCartItem } from '@/app/context/CourseContext';
import { useMarketplaceFilters } from '@/app/hooks/useMarketplaceFilters';

// ─── ค่าคงที่ ────────────────────────────────────────────────
/** จำนวนวันนับเป็น "คอร์สใหม่" */
const NEW_COURSE_DAYS = 30;
/** รีวิวขั้นต่ำก่อนแสดงดาว (ป้องกัน bias ตอน bootstrap) */
const MIN_REVIEWS_TO_SHOW_RATING = 5;
/** แสดง badge จำกัดที่นั่งเมื่อเหลือไม่ถึง % นี้ */
const LOW_SEAT_THRESHOLD_PCT = 30;

// ─── ประเภทที่นั่ง ────────────────────────────────────────────
const COURSE_TYPE_CONFIG = {
  ONLINE: {
    label: 'ออนไลน์',
    icon: Monitor,
    color: 'text-blue-600 bg-blue-50',
  },
  ONLINE_LIVE: {
    label: 'Live สด',
    icon: Video,
    color: 'text-orange-600 bg-orange-50',
  },
  ONSITE: {
    label: 'ออนไซต์',
    icon: MapPin,
    color: 'text-green-700 bg-green-50',
  },
} as const;

// ─── Helper functions ─────────────────────────────────────────

/** คำนวณ % ส่วนลดจากราคาตั้งต้น */
function calcDiscountPct(price: number, promoPrice: number): number {
  return Math.round(((price - promoPrice) / price) * 100);
}

/** ตรวจสอบว่าคอร์สสร้างภายใน N วันที่ผ่านมา */
function isNewCourse(createdAt: string | undefined, days: number): boolean {
  if (!createdAt) return false;
  const diffMs = Date.now() - new Date(createdAt).getTime();
  return diffMs < days * 24 * 60 * 60 * 1000;
}

/** คำนวณ % ที่ลงทะเบียนแล้ว (สำหรับ Progress Bar บน Card) */
function calcEnrolledPct(enrolled: number, max: number): number {
  return Math.min(Math.round((enrolled / max) * 100), 100);
}

// ─── Sub-components ───────────────────────────────────────────

/** แถบแสดงที่นั่งที่เหลือ — ใช้ข้อมูล static จาก list API */
function SeatBar({ enrolled, max }: { enrolled: number; max: number }) {
  const remaining = Math.max(0, max - enrolled);
  const isFull = remaining <= 0;
  const pct = isFull ? 100 : calcEnrolledPct(enrolled, max);

  const barColor =
    isFull ? 'bg-red-500' :
    pct >= 75 ? 'bg-orange-500' :
    pct >= 50 ? 'bg-yellow-500' :
    'bg-green-500';

  return (
    <div className="mt-2.5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-gray-500">ที่นั่ง</span>
        <span className={`text-[10px] font-semibold ${isFull ? 'text-red-600' : 'text-gray-700'}`}>
          {isFull ? 'ปิดรับสมัครแล้ว' : `เหลือ ${remaining}/${max} ที่`}
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/** แสดง badge ประเภทคอร์ส (ONLINE / LIVE / ONSITE) */
function CourseTypeBadge({ type }: { type: Course['courseType'] }) {
  const config = COURSE_TYPE_CONFIG[type];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${config.color}`}>
      <Icon size={10} />
      {config.label}
    </span>
  );
}

// ─── Avatar Stack: แสดงผู้สอนหลายคนซ้อนกัน ───────────────────

interface AvatarProps {
  person: Instructor | CourseInstructor;
  size?: number;
  className?: string;
}

function Avatar({ person, size = 24, className = '' }: AvatarProps) {
  const initial = person.name?.charAt(0) ?? 'T';
  return (
    <div
      style={{ width: size, height: size }}
      className={`relative rounded-full border-2 border-white overflow-hidden flex-shrink-0 ${className}`}
    >
      {person.profileImage ? (
        <Image src={person.profileImage} alt={person.name ?? ''} fill className="object-cover" />
      ) : (
        <div className="w-full h-full bg-primary text-white flex items-center justify-center text-[8px] font-bold">
          {initial}
        </div>
      )}
    </div>
  );
}

/** แสดง avatar ซ้อนกัน พร้อมชื่อผู้สอนหลัก + "และอีก N คน" */
interface InstructorStackProps {
  instructors: (Instructor | CourseInstructor)[];
  onClickLead?: (e: React.MouseEvent) => void;
  isLeadActive?: boolean;
}

function InstructorStack({ instructors, onClickLead, isLeadActive }: InstructorStackProps) {
  if (instructors.length === 0) return null;

  const lead = instructors[0];
  const extras = instructors.slice(1);
  const MAX_VISIBLE = 3;
  const visibleExtra = extras.slice(0, MAX_VISIBLE - 1);
  const hiddenCount = extras.length - visibleExtra.length;

  return (
    <div className="flex items-center gap-2">
      {/* Avatar ของ LEAD — คลิกได้เพื่อกรอง */}
      <button
        onClick={onClickLead}
        className={`relative flex-shrink-0 rounded-full border-2 overflow-hidden shadow-sm transition-all hover:scale-110 ${
          isLeadActive ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'
        }`}
        style={{ width: 24, height: 24 }}
        title={`กรองตาม ${lead.name}`}
      >
        {lead.profileImage ? (
          <Image src={lead.profileImage} alt={lead.name ?? ''} fill className="object-cover" />
        ) : (
          <div className="w-full h-full bg-primary text-white flex items-center justify-center text-[8px] font-bold">
            {lead.name?.charAt(0) ?? 'T'}
          </div>
        )}
        {isLeadActive && (
          <div className="absolute inset-0 bg-green-500/40 flex items-center justify-center">
            <CheckCircle2 size={10} className="text-white" />
          </div>
        )}
      </button>

      {/* Avatars ของผู้สอนคนอื่น (overlap กัน) */}
      {visibleExtra.length > 0 && (
        <div className="flex -space-x-1.5">
          {visibleExtra.map((inst, idx) => (
            <Avatar key={inst.id ?? idx} person={inst} size={20} className="shadow-sm" />
          ))}
          {hiddenCount > 0 && (
            <div className="w-5 h-5 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[8px] text-gray-500 font-bold shadow-sm">
              +{hiddenCount}
            </div>
          )}
        </div>
      )}

      {/* ชื่อผู้สอน */}
      <span className="text-[11px] text-gray-400 truncate">
        โดย {lead.name}
        {extras.length > 0 && ` และอีก ${extras.length} คน`}
      </span>
    </div>
  );
}

// ─── Component หลัก ──────────────────────────────────────────

interface CourseCardProps {
  course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { tutorId, toggleTutor } = useMarketplaceFilters();
  const { addToCart, isInCart } = useCourse();

  // ── ข้อมูลราคา ──────────────────────────────────────────────
  const hasDiscount =
    course.promotionalPrice != null && course.promotionalPrice < course.price;
  const displayPrice = hasDiscount ? course.promotionalPrice! : course.price;
  const discountPct = hasDiscount
    ? calcDiscountPct(course.price, course.promotionalPrice!)
    : 0;

  // ── ข้อมูล badge ─────────────────────────────────────────────
  const isNew = isNewCourse(course.createdAt, NEW_COURSE_DAYS);

  // กำหนด badge ลำดับ priority — แสดงสูงสุด 2 อัน
  const badgeCandidates = [
    course.isBestSeller && { label: 'มาแรง!!', color: 'bg-amber-500 text-white' },
    course.isRecommended && { label: 'แนะนำ', color: 'bg-blue-600 text-white' },
    isNew && { label: 'ใหม่', color: 'bg-green-600 text-white' },
  ].filter(Boolean) as { label: string; color: string }[];
  const visibleBadges = badgeCandidates.slice(0, 2);

  // ── ข้อมูล rating ────────────────────────────────────────────
  const reviewCount = course.reviewCount ?? course._count?.reviews ?? 0;
  const showRating = reviewCount >= MIN_REVIEWS_TO_SHOW_RATING;
  const displayRating = course.rating ?? 0;

  // ── ข้อมูล tutor filter ──────────────────────────────────────
  // รวม instructors[] กับ instructor เดี่ยว (backward compat)
  const allInstructors: (Instructor | CourseInstructor)[] =
    course.instructors && course.instructors.length > 0
      ? course.instructors
      : course.instructor
      ? [course.instructor]
      : [];
  const leadInstructor = allInstructors[0] ?? null;
  const isTutorActive = tutorId === leadInstructor?.id;

  // ── ข้อมูลที่นั่ง (Progress Bar) ─────────────────────────────
  const isLimitedCourse =
    course.courseType === 'ONSITE' || course.courseType === 'ONLINE_LIVE';
  const enrolledCount = course._count?.enrollments ?? 0;
  const maxSeats = course.maxSeats;
  const showSeatBar = isLimitedCourse && maxSeats != null && maxSeats > 0;

  // badge "จำกัดที่นั่ง" แสดงเมื่อเหลือน้อย แต่ยังไม่เต็ม
  const seatPct = showSeatBar ? calcEnrolledPct(enrolledCount, maxSeats!) : 0;
  const showLowSeatBadge =
    showSeatBar &&
    seatPct >= (100 - LOW_SEAT_THRESHOLD_PCT) &&
    seatPct < 100 &&
    !visibleBadges.find((b) => b.label === 'จำกัดที่นั่ง');

  // ── ข้อมูล CTA ───────────────────────────────────────────────
  const isFull = showSeatBar && enrolledCount >= maxSeats!;
  const alreadyInCart = isInCart(course.id);
  const ctaLabel =
    isFull ? 'ปิดรับสมัครแล้ว' :
    isLimitedCourse ? 'จองที่นั่ง' :
    'ซื้อคอร์สนี้';

  // ── Event handlers ───────────────────────────────────────────
  const handleTutorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!leadInstructor) return;
    if (pathname === '/explore') {
      toggleTutor(leadInstructor.id);
    } else {
      router.push(`/explore?tutorId=${leadInstructor.id}`);
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (alreadyInCart) {
      toast.info('คอร์สนี้อยู่ในตะกร้าแล้ว');
      return;
    }
    addToCart(toCartItem(course));
    toast.success('เพิ่มลงตะกร้าแล้ว', {
      description: course.title,
      duration: 2500,
    });
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFull) return;
    // เพิ่มเข้าตะกร้าก่อนแล้วไปหน้า checkout
    if (!alreadyInCart) {
      addToCart(toCartItem(course));
    }
    router.push('/cart');
  };

  // ─────────────────────────────────────────────────────────────

  return (
    <Link
      href={`/course/${course.slug}`}
      className={`block bg-white rounded-2xl border shadow-sm transition-all duration-300 overflow-hidden flex flex-col h-full group w-[280px] md:w-full flex-shrink-0 relative ${
        isFull
          ? 'border-gray-200 opacity-80'
          : 'border-gray-100 hover:shadow-lg hover:-translate-y-0.5'
      }`}
    >
      {/* ── Thumbnail ── */}
      <div className="relative h-44 w-full bg-gray-100 overflow-hidden">
        {course.thumbnail ? (
          <Image
            src={encodeURI(course.thumbnail)}
            alt={course.title}
            fill
            className={`object-cover transition-transform duration-500 ${
              isFull ? 'grayscale-[30%]' : 'group-hover:scale-105'
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-sm">
            ไม่มีรูปภาพ
          </div>
        )}

        {/* Overlay เมื่อเต็ม */}
        {isFull && (
          <div className="absolute inset-0 bg-gray-900/40 flex items-center justify-center">
            <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg tracking-wide">
              ปิดรับสมัครแล้ว
            </span>
          </div>
        )}

        {/* Badges มุมบนซ้าย — สูงสุด 2 อัน (ซ่อนเมื่อเต็ม เพื่อไม่รก) */}
        {!isFull && (visibleBadges.length > 0 || showLowSeatBadge) && (
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {visibleBadges.map((b) => (
              <span
                key={b.label}
                className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${b.color}`}
              >
                {b.label}
              </span>
            ))}
            {showLowSeatBadge && visibleBadges.length < 2 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded shadow-sm bg-orange-500 text-white">
                จำกัดที่นั่ง
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="p-4 flex flex-col flex-grow">

        {/* Category chip */}
        <div className="mb-2">
          <span className="text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
            {course.category?.name ?? 'วิชาทั่วไป'}
          </span>
        </div>

        {/* ชื่อคอร์ส */}
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1 line-clamp-2 min-h-[2.75rem]">
          {course.title}
        </h3>

        {/* Rating — แสดงเฉพาะเมื่อมีรีวิวมากพอ */}
        {showRating && (
          <div className="flex items-center gap-1 mb-1.5">
            <Star size={11} className="text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-gray-700">
              {displayRating.toFixed(1)}
            </span>
            <span className="text-[10px] text-gray-400">({reviewCount} รีวิว)</span>
          </div>
        )}
        {!showRating && reviewCount > 0 && (
          <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full inline-block mb-1.5 w-fit">
            รีวิวใหม่
          </span>
        )}

        {/* คำอธิบายสั้น */}
        {course.shortDescription && (
          <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 leading-relaxed">
            {course.shortDescription}
          </p>
        )}

        {/* Info Chips */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          <CourseTypeBadge type={course.courseType} />

          {course.duration && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              <Clock size={10} />
              {course.duration}
            </span>
          )}

          {course.level?.name && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              <GraduationCap size={10} />
              {course.level.name}
            </span>
          )}

          {/* วันเริ่มเรียน เฉพาะ ONSITE/LIVE */}
          {isLimitedCourse && course.enrollStartDate && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              <CalendarDays size={10} />
              {new Date(course.enrollStartDate).toLocaleDateString('th-TH', {
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}

          {/* จำนวน videos/sessions สำหรับ ONLINE */}
          {!isLimitedCourse && course.videoCount > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              <BookOpen size={10} />
              {course.videoCount} บท
            </span>
          )}
        </div>

        {/* Progress Bar ที่นั่ง — เฉพาะ ONSITE/LIVE */}
        {showSeatBar && (
          <SeatBar enrolled={enrolledCount} max={maxSeats!} />
        )}

        {/* Tutor row — รองรับผู้สอนหลายคน */}
        {allInstructors.length > 0 && (
          <div className="mt-2.5">
            <InstructorStack
              instructors={allInstructors}
              onClickLead={handleTutorClick}
              isLeadActive={isTutorActive}
            />
          </div>
        )}

        {/* ── Price + CTA ── */}
        <div className="mt-auto pt-3 border-t border-gray-100">

          {/* ราคา */}
          <div className="flex items-baseline gap-2 mb-2.5">
            {hasDiscount ? (
              <>
                <span className="text-xl font-bold text-secondary">
                  ฿{displayPrice.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400 line-through">
                  ฿{course.price.toLocaleString()}
                </span>
                <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
                  -{discountPct}%
                </span>
              </>
            ) : (
              <span className="text-xl font-bold text-secondary">
                ฿{displayPrice.toLocaleString()}
              </span>
            )}
          </div>

          {/* ปุ่ม CTA */}
          <div className="flex gap-2">
            {/* ปุ่มเพิ่มตะกร้า */}
            <button
              onClick={handleAddToCart}
              disabled={isFull}
              title={alreadyInCart ? 'อยู่ในตะกร้าแล้ว' : 'เพิ่มลงตะกร้า'}
              className={`flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border transition-all ${
                isFull
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                  : alreadyInCart
                  ? 'border-green-400 text-green-600 bg-green-50'
                  : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5'
              }`}
            >
              <ShoppingCart size={15} />
            </button>

            {/* ปุ่มซื้อ/จอง หลัก */}
            <button
              onClick={handleBuyNow}
              disabled={isFull}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                isFull
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : isLimitedCourse
                  ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                  : 'bg-primary hover:bg-primary/90 text-white shadow-sm'
              }`}
            >
              {!isFull && (isLimitedCourse ? <Zap size={13} /> : <ArrowRight size={13} />)}
              {ctaLabel}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
