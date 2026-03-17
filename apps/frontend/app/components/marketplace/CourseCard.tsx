'use client';

/**
 * CourseCard — Marketplace / Landing Page course listing card.
 *
 * Design principles:
 *  - 4-zone layout (Thumbnail → Header → Meta → Footer) with fixed min-h per zone
 *    so ALL cards in a row are the same height regardless of content variance.
 *  - Scroll-entrance animation via IntersectionObserver (staggered per index).
 *  - Hover: card lifts + shadow escalates + thumbnail zooms in.
 *  - CTA button: shimmer sweep on hover (GPU-accelerated via globals.css).
 *  - Cart add: icon bounce feedback (optimistic — no API wait).
 *  - Urgency badge overlay: shown when < 30% seats remaining (ONSITE/LIVE).
 *  - Above-fold images: priority={true} when index < 5.
 *  - Prefetch course detail page on card hover.
 *
 * @param index  Position in the rendered grid — controls stagger delay.
 * @param priority Whether to eagerly load the thumbnail (above-fold cards).
 */

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
  Flame,
} from 'lucide-react';
import { toast } from 'sonner';

import { Course, CourseInstructor, Instructor } from '@/app/lib/types';
import { useCourse, toCartItem } from '@/app/context/CourseContext';
import { useMarketplaceFilters } from '@/app/hooks/useMarketplaceFilters';
import { useCourseAvailability } from '@/app/hooks/useCourseAvailability';

// ─── Constants ────────────────────────────────────────────────────────────────

/** Days since creation before "New" badge disappears */
const NEW_COURSE_DAYS = 30;
/** Minimum reviews before we trust the rating average */
const MIN_REVIEWS_TO_SHOW_RATING = 5;
/** Show "Low Seats" badge when this % of seats are filled */
const LOW_SEAT_THRESHOLD_PCT = 30;
/** Show 🔥 Urgency badge when remaining seats are below this % */
const URGENCY_SEAT_THRESHOLD_PCT = 30;
/** Animation stagger step per card (ms) */
const STAGGER_DELAY_MS = 80;

// ─── Course Type Config ──────────────────────────────────────────────────────

const COURSE_TYPE_CONFIG = {
  ONLINE:      { label: 'ออนไลน์', icon: Monitor, color: 'text-blue-600 bg-blue-50' },
  ONLINE_LIVE: { label: 'Live สด',  icon: Video,   color: 'text-orange-600 bg-orange-50' },
  ONSITE:      { label: 'ออนไซต์', icon: MapPin,   color: 'text-green-700 bg-green-50' },
} as const;

// ─── Helper Functions ─────────────────────────────────────────────────────────

function calcDiscountPct(price: number, promoPrice: number) {
  return Math.round(((price - promoPrice) / price) * 100);
}

function isNewCourse(createdAt: string | undefined, days: number) {
  if (!createdAt) return false;
  return Date.now() - new Date(createdAt).getTime() < days * 86_400_000;
}

function calcEnrolledPct(enrolled: number, max: number) {
  return Math.min(Math.round((enrolled / max) * 100), 100);
}

// ─── Custom Hook: Scroll Entrance ─────────────────────────────────────────────

/**
 * Triggers a fade+slide-up entrance animation as the element enters the viewport.
 * @param delay  Extra delay in ms (for staggering).
 */
function useCardEntrance(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const t = setTimeout(() => setIsVisible(true), delay);
          obs.disconnect();
          return () => clearTimeout(t);
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );

    obs.observe(el);
    return () => obs.disconnect();
  }, [delay]);

  return { ref, isVisible };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Seat progress bar with colour ramp */
function SeatBar({
  remaining, max, isFull, pct, isReservedOnly,
}: {
  remaining: number; max: number; isFull: boolean; pct: number; isReservedOnly: boolean;
}) {
  // When maxSeats is unknown (max=0) but course is full, clamp to 100%
  const displayPct   = max === 0 && isFull ? 100 : pct;
  const showCount    = max > 0;

  const barColor =
    isReservedOnly  ? 'bg-orange-400' :
    isFull          ? 'bg-red-500'    :
    displayPct >= 75 ? 'bg-orange-500' :
    displayPct >= 50 ? 'bg-yellow-500' :
    'bg-green-500';

  return (
    <div className="mt-1.5">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] text-gray-500">ที่นั่ง</span>
        <span className={`text-[10px] font-semibold ${isFull ? 'text-red-600' : 'text-gray-700'}`}>
          {isReservedOnly
            ? 'จองชั่วคราวเต็ม'
            : isFull
            ? 'ปิดรับสมัครแล้ว'
            : showCount
            ? `เหลือ ${remaining}/${max} ที่`
            : 'ยังมีที่ว่าง'}
        </span>
      </div>
      {/* Track */}
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor} ${isReservedOnly && !isFull ? 'animate-pulse' : ''}`}
          style={{ width: `${displayPct}%` }}
        />
      </div>
    </div>
  );
}

/** Small inline badge for course type (ONLINE / LIVE / ONSITE) */
function CourseTypeBadge({ type }: { type: Course['courseType'] }) {
  const { label, icon: Icon, color } = COURSE_TYPE_CONFIG[type];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${color}`}>
      <Icon size={10} />
      {label}
    </span>
  );
}

// ─── Instructor Avatar Stack ───────────────────────────────────────────────────

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
      className={`relative rounded-full border-2 border-white overflow-hidden shrink-0 ${className}`}
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
      {/* Lead avatar — clickable filter */}
      <button
        onClick={onClickLead}
        className={`relative shrink-0 rounded-full border-2 overflow-hidden shadow-sm transition-all hover:scale-110 ${
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

      {/* Extra avatars */}
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

      <span className="text-[11px] text-gray-400 truncate">
        โดย {lead.name}
        {extras.length > 0 && ` และอีก ${extras.length} คน`}
      </span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

interface CourseCardProps {
  course: Course;
  /** Grid position — controls stagger entrance delay */
  index?: number;
  /** Pass true for cards in the first visible row (improves LCP) */
  priority?: boolean;
}

export default function CourseCard({ course, index = 0, priority = false }: CourseCardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { tutorId, toggleTutor } = useMarketplaceFilters();
  const { addToCart, isInCart } = useCourse();

  // ── Entrance animation ─────────────────────────────────────────────────────
  const { ref: entranceRef, isVisible } = useCardEntrance(index * STAGGER_DELAY_MS);

  // ── Cart bounce feedback ───────────────────────────────────────────────────
  const [cartBounce, setCartBounce] = useState(false);

  // ── Pricing ───────────────────────────────────────────────────────────────
  const hasDiscount = course.promotionalPrice != null && course.promotionalPrice < course.price;
  const displayPrice = hasDiscount ? course.promotionalPrice! : course.price;
  const discountPct  = hasDiscount ? calcDiscountPct(course.price, course.promotionalPrice!) : 0;

  // ── Badges ────────────────────────────────────────────────────────────────
  const isNew = isNewCourse(course.createdAt, NEW_COURSE_DAYS);
  const badgeCandidates = [
    course.isBestSeller  && { label: 'มาแรง!!', color: 'bg-amber-500 text-white' },
    course.isRecommended && { label: 'แนะนำ',   color: 'bg-blue-600 text-white' },
    isNew                && { label: 'ใหม่',    color: 'bg-green-600 text-white' },
  ].filter(Boolean) as { label: string; color: string }[];
  const visibleBadges = badgeCandidates.slice(0, 2);

  // ── Rating ────────────────────────────────────────────────────────────────
  const reviewCount   = course.reviewCount ?? course._count?.reviews ?? 0;
  const showRating    = reviewCount >= MIN_REVIEWS_TO_SHOW_RATING;
  const displayRating = course.rating ?? 0;

  // ── Instructors ───────────────────────────────────────────────────────────
  const allInstructors: (Instructor | CourseInstructor)[] =
    course.instructors?.length ? course.instructors
    : course.instructor         ? [course.instructor]
    : [];
  const leadInstructor = allInstructors[0] ?? null;
  const isTutorActive  = tutorId === leadInstructor?.id;

  // ── Seat / availability (ONSITE + LIVE only) ──────────────────────────────
  const isLimitedCourse  = course.courseType === 'ONSITE' || course.courseType === 'ONLINE_LIVE';
  const { availability } = useCourseAvailability(course.id, {
    disabled: !isLimitedCourse,
    pollInterval: 0, // no polling on list page — avoid API spam
  });

  const enrolledCount    = course._count?.enrollments ?? 0;
  const maxSeats         = course.maxSeats;

  // Derive seat state from live availability data first, then fall back to static counts
  const liveIsFull       = availability ? availability.isFull        : maxSeats != null && maxSeats > 0 && enrolledCount >= maxSeats;
  const liveRemaining    = availability ? (availability.remaining ?? 0) : maxSeats ? Math.max(0, maxSeats - enrolledCount) : 0;
  const liveReservedOnly = availability ? availability.isReservedOnly : false;
  const livePct          = availability
    ? (availability.percentage ?? 100)
    : maxSeats != null && maxSeats > 0
    ? calcEnrolledPct(enrolledCount, maxSeats)
    : 0;

  // Show SeatBar when: limited course WITH known seats, OR full regardless of maxSeats
  const showSeatBar      = isLimitedCourse && (
    (maxSeats != null && maxSeats > 0) || liveIsFull
  );

  const showLowSeatBadge = showSeatBar && livePct >= (100 - LOW_SEAT_THRESHOLD_PCT) && livePct < 100 && !visibleBadges.find(b => b.label === 'จำกัดที่นั่ง');

  // 🔥 Urgency badge: remaining < 30% and not fully closed
  const showUrgencyBadge = showSeatBar && liveRemaining > 0 && livePct >= (100 - URGENCY_SEAT_THRESHOLD_PCT);

  // ── CTA state ─────────────────────────────────────────────────────────────
  const isFull       = liveIsFull;
  const alreadyInCart = isInCart(course.id);
  const ctaLabel =
    isFull           ? 'ปิดรับสมัครแล้ว' :
    isLimitedCourse  ? 'จองที่นั่ง' :
    'ซื้อคอร์สนี้';

  // ── Event handlers ────────────────────────────────────────────────────────

  /** Prefetch course detail on hover for near-instant navigation */
  const handleMouseEnter = () => router.prefetch(`/course/${course.slug || course.id}`);

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
    toast.success('เพิ่มลงตะกร้าแล้ว', { description: course.title, duration: 2500 });

    // Optimistic bounce feedback
    setCartBounce(true);
    setTimeout(() => setCartBounce(false), 350);
  };

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isFull) return;
    if (!alreadyInCart) addToCart(toCartItem(course));
    router.push('/checkout');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    /*
     * Entrance wrapper — IntersectionObserver controls opacity + translateY.
     * motion-reduce disables the animation for users who prefer reduced motion.
     */
    <div
      ref={entranceRef}
      className={`
        transition-[opacity,transform] duration-500 ease-out
        motion-reduce:transition-none motion-reduce:opacity-100 motion-reduce:translate-y-0
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}
      `}
    >
      <Link
        href={`/course/${course.slug || course.id}`}
        onMouseEnter={handleMouseEnter}
        className={`
          group block bg-white rounded-2xl border shadow-sm w-full h-full relative
          flex flex-col overflow-hidden
          transition-[transform,box-shadow] duration-250 ease-out
          ${isFull
            ? 'border-gray-200 opacity-75 cursor-pointer'
            : 'border-gray-100 hover:-translate-y-1 hover:shadow-xl'}
        `}
      >

        {/* ══════════════════════════════════════════════════════════════
            ZONE 1 · THUMBNAIL  (fixed height — equal across all cards)
        ══════════════════════════════════════════════════════════════ */}
        <div className="relative h-36 w-full bg-gray-100 overflow-hidden">
          {course.thumbnail ? (
            <Image
              src={encodeURI(course.thumbnail)}
              alt={course.title}
              fill
              priority={priority}
              className={`object-cover transition-transform duration-500 ${
                isFull ? 'grayscale-[30%]' : 'group-hover:scale-[1.04]'
              }`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 text-gray-400 text-sm font-medium">
              ไม่มีรูปภาพ
            </div>
          )}

          {/* Sold-out overlay */}
          {isFull && (
            <div className="absolute inset-0 bg-gray-900/50 flex items-center justify-center backdrop-blur-[1px]">
              <span className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg tracking-wide">
                ปิดรับสมัครแล้ว
              </span>
            </div>
          )}

          {/* Top-left promo badges */}
          {!isFull && (visibleBadges.length > 0 || showLowSeatBadge) && (
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
              {visibleBadges.map(b => (
                <span key={b.label} className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${b.color}`}>
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

          {/* 🔥 Urgency badge — bottom-right */}
          {showUrgencyBadge && (
            <div className="absolute bottom-8 right-2 z-10">
              <span className="inline-flex items-center gap-1 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-lg animate-pulse">
                <Flame size={10} />
                เหลือ {liveRemaining} ที่!
              </span>
            </div>
          )}

          {/* Discount badge — bottom-left above instructor strip */}
          {hasDiscount && !isFull && (
            <div className="absolute bottom-8 left-2 z-10">
              <span className="bg-red-500/90 backdrop-blur-sm text-white text-[11px] font-extrabold px-2 py-0.5 rounded shadow">
                ลด {discountPct}%
              </span>
            </div>
          )}


        </div>

        {/* ══════════════════════════════════════════════════════════════
            ZONE 2 · HEADER  (compact — reduced min-h)
        ══════════════════════════════════════════════════════════════ */}
        <div className="px-3 pt-2.5 pb-0 min-h-[72px]">
          {/* Category + Rating row */}
          <div className="flex justify-between items-center mb-1">
            <span className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full leading-snug">
              {course.category?.name ?? 'วิชาทั่วไป'}
            </span>
            {showRating ? (
              <div className="flex items-center gap-1">
                <Star size={10} className="text-amber-400 fill-amber-400" />
                <span className="text-[11px] font-semibold text-gray-700">{displayRating.toFixed(1)}</span>
                <span className="text-[10px] text-gray-400">({reviewCount})</span>
              </div>
            ) : reviewCount > 0 ? (
              <span className="text-[10px] text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">รีวิวใหม่</span>
            ) : null}
          </div>

          {/* Course title */}
          <h3 className="font-bold text-gray-900 text-[13px] leading-snug line-clamp-2 min-h-[36px]">
            {course.title}
          </h3>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ZONE 3 · META CHIPS  (compact — min-h reduced)
        ══════════════════════════════════════════════════════════════ */}
        <div className="px-3 pt-1.5 min-h-[44px] flex flex-col gap-1">
          {/* Info chips row */}
          <div className="flex flex-wrap gap-1">
            <CourseTypeBadge type={course.courseType} />

            {course.duration && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                <Clock size={9} />
                {course.duration}
              </span>
            )}

            {course.level?.name && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                <GraduationCap size={9} />
                {course.level.name}
              </span>
            )}

            {!isLimitedCourse && course.videoCount > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
                <BookOpen size={9} />
                {course.videoCount} บท
              </span>
            )}
          </div>

          {/* Start date chip — ONSITE / LIVE only */}
          {isLimitedCourse && course.enrollStartDate ? (
            <div className="flex">
              <span className="inline-flex items-center gap-1 text-[10px] text-primary bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10 font-medium">
                <CalendarDays size={10} />
                เริ่ม {new Date(course.enrollStartDate).toLocaleDateString('th-TH', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
            </div>
          ) : (
            /* Placeholder keeps ONLINE cards same height as ONSITE */
            <div className="h-[20px]" aria-hidden="true" />
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ZONE 4 · FOOTER
        ══════════════════════════════════════════════════════════════ */}
        <div className="mt-auto px-3 pb-3 pt-2 border-t border-gray-100">

          {/* Instructor row — links to tutor profile page */}
          {leadInstructor && (
            <button
              onClick={handleTutorClick}
              className="w-full flex items-center gap-2 py-2 mb-2 border-b border-gray-50 group/tutor focus:outline-none"
            >
              <div className="relative w-6 h-6 rounded-full overflow-hidden ring-1 ring-gray-200 flex-shrink-0 bg-gray-100">
                {leadInstructor.profileImage ? (
                  <Image
                    src={leadInstructor.profileImage}
                    alt={leadInstructor.name ?? ''}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] text-gray-500 font-bold">
                    {leadInstructor.name?.charAt(0) ?? 'T'}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-gray-500 truncate group-hover/tutor:text-blue-600 transition-colors leading-none">
                {(leadInstructor as any).nickname ?? leadInstructor.name}
              </span>
              {allInstructors.length > 1 && (
                <span className="text-[10px] text-gray-400 flex-shrink-0">+{allInstructors.length - 1}</span>
              )}
            </button>
          )}

          {/* Seat progress bar — ONSITE / LIVE only */}
          {showSeatBar && (
            <SeatBar
              remaining={liveRemaining}
              max={maxSeats ?? 0}
              isFull={isFull}
              pct={livePct}
              isReservedOnly={liveReservedOnly}
            />
          )}

          {/* Price + CTA */}
          <div className={showSeatBar ? 'mt-2' : ''}>
            {/* Price */}
            <div className="flex items-end gap-1.5 mb-2">
              <span className={`text-lg font-extrabold leading-none ${hasDiscount ? 'text-secondary' : 'text-gray-900'}`}>
                ฿{displayPrice.toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through leading-relaxed">
                  ฿{course.price.toLocaleString()}
                </span>
              )}
            </div>

            {/* CTA buttons: bigger on mobile (touch target), normal on desktop */}
            <div className="flex gap-1.5">
              {/* Cart icon button */}
              <button
                onClick={handleAddToCart}
                disabled={isFull}
                title={alreadyInCart ? 'อยู่ในตะกร้าแล้ว' : 'เพิ่มลงตะกร้า'}
                className={`
                  shrink-0 w-11 sm:w-10 h-11 sm:h-9 flex items-center justify-center rounded-xl border transition-all
                  ${cartBounce ? 'scale-125' : 'scale-100'}
                  ${isFull
                    ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                    : alreadyInCart
                    ? 'border-green-400 text-green-600 bg-green-50'
                    : 'border-gray-300 text-gray-600 hover:border-primary hover:text-primary hover:bg-primary/5'}
                `}
              >
                <ShoppingCart size={16} />
              </button>

              {/* Primary buy / reserve CTA with shimmer */}
              <button
                onClick={handleBuyNow}
                disabled={isFull}
                className={`
                  course-card-cta
                  flex-1 relative overflow-hidden
                  flex items-center justify-center gap-1.5
                  h-11 sm:h-9 rounded-xl text-sm font-bold
                  transition-all duration-250
                  ${isFull
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isLimitedCourse
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow-orange-500/30 hover:shadow-md'
                    : 'bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-primary/30 hover:shadow-md'}
                `}
              >
                {!isFull && (isLimitedCourse ? <Zap size={14} /> : <ArrowRight size={14} />)}
                {ctaLabel}
              </button>
            </div>
          </div>
        </div>

      </Link>
    </div>
  );
}
