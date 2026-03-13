import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Star, BookOpen, Award, Quote,
  GraduationCap, Briefcase, Users, MessageSquare,
  Facebook, Instagram, Youtube, Linkedin, Globe,
} from "lucide-react";
import { tutorApi } from "@/app/lib/api";
import { OptimizedImage } from "@/app/components/ui/OptimizedImage";
import CourseCard from "@/app/components/marketplace/CourseCard";
import type { TutorPublicProfile, TutorReview } from "@/app/lib/types";

// TikTok inline SVG (not in lucide-react)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className ?? "w-5 h-5"}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.77a4.85 4.85 0 0 1-1.03-.08z" />
    </svg>
  );
}

export const revalidate = 3600;

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const res = await tutorApi.getById(params.id);
  const tutor = res.data;
  if (!tutor) return { title: "Tutor Not Found" };
  return {
    title: `${tutor.name}${tutor.nickname ? ` (${tutor.nickname})` : ""} — SigmaTutor`,
    description: tutor.bio ?? `ทำความรู้จักกับ ${tutor.name} ผู้สอนใน SigmaTutor`,
  };
}

// ── Sub-components ──────────────────────────────────────────────────────────

function StatPill({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center bg-white/10 backdrop-blur-sm rounded-2xl px-5 py-4 min-w-[100px]">
      <div className="text-white/70 mb-1">{icon}</div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-white/70 mt-0.5 text-center">{label}</p>
    </div>
  );
}

function StarBar({ rating, total }: { rating: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star key={s} className={`w-4 h-4 ${s <= Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
        ))}
      </div>
      <span className="font-bold text-gray-900">{rating.toFixed(1)}</span>
      <span className="text-sm text-gray-500">({total} รีวิว)</span>
    </div>
  );
}

function RatingDistributionBar({ distribution }: { distribution: { star: number; count: number }[]; }) {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);
  return (
    <div className="space-y-1.5">
      {[...distribution].reverse().map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-sm">
          <span className="w-4 text-right text-gray-600">{star}</span>
          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400 flex-shrink-0" />
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 rounded-full transition-all"
              style={{ width: `${(count / maxCount) * 100}%` }}
            />
          </div>
          <span className="w-6 text-gray-500 text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: TutorReview }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-full overflow-hidden bg-blue-100 flex-shrink-0">
          {review.user.profileImage ? (
            <img src={review.user.profileImage} alt={review.user.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-sm">
              {review.user.name.charAt(0)}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{review.user.name}</p>
          <p className="text-xs text-gray-400 truncate">{review.course.title}</p>
        </div>
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} className={`w-3 h-3 ${s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
          ))}
        </div>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">{review.comment}</p>
      )}
    </div>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default async function TutorProfilePage({ params }: Props) {
  const res = await tutorApi.getById(params.id);
  const tutor = res.data as TutorPublicProfile | null;

  if (!res.success || !tutor) notFound();

  const courseCount = tutor.courses?.length ?? 0;
  const displayNickname = tutor.nickname ?? tutor.name;
  const hasSocialLinks =
    tutor.tiktokUrl || tutor.instagramUrl || tutor.facebookUrl || tutor.linkedinUrl || tutor.socialLink;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-24">
      {/* Sticky back nav */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/tutors" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors gap-1">
            <ArrowLeft className="w-4 h-4" />
            กลับไปหน้ารายชื่อครู
          </Link>
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 pb-12">
        {/* Banner strip */}
        <div className="h-40 md:h-52 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 md:-mt-32">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-end">
            {/* Avatar */}
            <div className="w-44 h-44 md:w-52 md:h-52 rounded-full border-8 border-white shadow-xl overflow-hidden bg-gray-100 flex-shrink-0 z-10">
              {tutor.profileImage ? (
                <img src={tutor.profileImage} alt={tutor.name ?? ""} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-blue-200 text-blue-700 text-5xl font-extrabold">
                  {(tutor.name ?? "?").charAt(0)}
                </div>
              )}
            </div>

            {/* Name / title */}
            <div className="flex-1 text-center md:text-left pb-4 md:pb-8">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white leading-tight tracking-tight">
                {displayNickname}
              </h1>
              {tutor.nickname && (
                <p className="text-blue-200 text-lg mt-1">{tutor.name}</p>
              )}
              {tutor.title && (
                <span className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-white/15 backdrop-blur-sm text-white font-semibold rounded-full text-sm border border-white/20">
                  <Award className="w-4 h-4" />
                  {tutor.title}
                </span>
              )}

              {/* Social links */}
              {hasSocialLinks && (
                <div className="flex items-center gap-3 mt-4 justify-center md:justify-start">
                  {tutor.tiktokUrl && (
                    <a href={tutor.tiktokUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" aria-label="TikTok">
                      <TikTokIcon className="w-4 h-4" />
                    </a>
                  )}
                  {tutor.instagramUrl && (
                    <a href={tutor.instagramUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" aria-label="Instagram">
                      <Instagram className="w-4 h-4" />
                    </a>
                  )}
                  {tutor.facebookUrl && (
                    <a href={tutor.facebookUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" aria-label="Facebook">
                      <Facebook className="w-4 h-4" />
                    </a>
                  )}
                  {tutor.linkedinUrl && (
                    <a href={tutor.linkedinUrl} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" aria-label="LinkedIn">
                      <Linkedin className="w-4 h-4" />
                    </a>
                  )}
                  {tutor.socialLink && !tutor.facebookUrl && !tutor.tiktokUrl && !tutor.instagramUrl && (
                    <a href={tutor.socialLink} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors" aria-label="Social">
                      <Globe className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Stats strip ── */}
          <div className="flex flex-wrap gap-3 mt-8 justify-center md:justify-start">
            <StatPill icon={<BookOpen className="w-5 h-5" />} label="คอร์ส" value={courseCount} />
            <StatPill icon={<Users className="w-5 h-5" />} label="นักเรียน" value={tutor.totalStudents ?? 0} />
            <StatPill icon={<Star className="w-5 h-5" />} label="คะแนนเฉลี่ย" value={(tutor.averageRating ?? 0).toFixed(1)} />
            <StatPill icon={<MessageSquare className="w-5 h-5" />} label="รีวิว" value={tutor.totalReviews ?? 0} />
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* ── Left sidebar ── */}
          <aside className="lg:col-span-1 space-y-6">

            {/* Quote */}
            {tutor.quote && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-5 relative overflow-hidden">
                <Quote className="absolute -top-2 -left-2 w-12 h-12 text-blue-200 opacity-60" />
                <blockquote className="text-gray-700 italic leading-relaxed text-sm relative z-10 pt-4">
                  "{tutor.quote}"
                </blockquote>
              </div>
            )}

            {/* Expertise */}
            {tutor.expertise && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  ความเชี่ยวชาญ
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tutor.expertise.split(/[,，/]/).map((tag, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 text-xs px-3 py-1 rounded-full border border-blue-100">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Achievements */}
            {(tutor.achievements?.length ?? 0) > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Award className="w-4 h-4 text-yellow-500" />
                  ผลงาน / รางวัล
                </h3>
                <ul className="space-y-2">
                  {tutor.achievements!.map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="mt-0.5 text-yellow-500">🏆</span>
                      <span>{a}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>

          {/* ── Main column ── */}
          <div className="lg:col-span-2 space-y-10">

            {/* Bio */}
            {tutor.bio && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Quote className="w-28 h-28 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">เกี่ยวกับครู</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">{tutor.bio}</p>
              </section>
            )}

            {/* Education Timeline */}
            {(tutor.educationHistory?.length ?? 0) > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  เส้นทางการศึกษา
                </h2>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-1 bottom-1 w-0.5 bg-indigo-100" />
                  <ul className="space-y-5 pl-8">
                    {tutor.educationHistory!.map((entry, i) => (
                      <li key={i} className="relative">
                        <div className="absolute -left-5 top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm" />
                        <p className="text-sm text-gray-700 leading-relaxed">{entry}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>
            )}

            {/* Reviews */}
            {(tutor.totalReviews ?? 0) > 0 && (
              <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  รีวิวจากผู้เรียน
                </h2>
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                  {/* Big rating number */}
                  <div className="flex flex-col items-center justify-center bg-yellow-50 rounded-2xl p-6 min-w-[120px]">
                    <p className="text-5xl font-extrabold text-gray-900">{(tutor.averageRating ?? 0).toFixed(1)}</p>
                    <div className="flex mt-2 gap-0.5">
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= Math.round(tutor.averageRating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2 text-center">{tutor.totalReviews} รีวิว</p>
                  </div>
                  {/* Distribution */}
                  {tutor.ratingDistribution && (
                    <div className="flex-1">
                      <RatingDistributionBar distribution={tutor.ratingDistribution} />
                    </div>
                  )}
                </div>

                {tutor.recentReviews && tutor.recentReviews.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tutor.recentReviews.map((review) => (
                      <ReviewCard key={review.id} review={review} />
                    ))}
                  </div>
                )}
              </section>
            )}

            {/* Courses */}
            {courseCount > 0 && (
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  คอร์สที่สอน
                  <span className="text-gray-400 font-normal text-base">({courseCount})</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {tutor.courses.map((course: any) => (
                    <CourseCard key={course.id} course={course} />
                  ))}
                </div>
              </section>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
