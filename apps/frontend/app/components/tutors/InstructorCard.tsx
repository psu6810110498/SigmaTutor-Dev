import Link from 'next/link';
import { InstructorPublic } from '@/app/lib/types';
import { OptimizedImage } from '../ui/OptimizedImage';
import { GraduationCap, Briefcase, ChevronRight } from 'lucide-react';

interface InstructorCardProps {
  instructor: InstructorPublic;
}

export function InstructorCard({ instructor }: InstructorCardProps) {
  // Truncate bio for quote
  const truncateBio = (bio?: string | null) => {
    if (!bio) return null;
    return bio.length > 100 ? `${bio.substring(0, 100)}...` : bio;
  };

  const displayName = instructor.nickname 
    ? `${instructor.name} (${instructor.nickname})`
    : instructor.name;

  return (
    <Link 
      href={`/tutors/${instructor.id}`}
      className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-blue-100 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 h-full"
    >
      {/* Top Half: Image & Title Background */}
      <div className="relative pt-6 px-6 pb-0 flex flex-col items-center text-center bg-gradient-to-b from-blue-50/50 to-white">
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-white shadow-md mb-4 bg-gray-50 flex-shrink-0">
          {instructor.profileImage ? (
            <OptimizedImage
              src={instructor.profileImage}
              alt={displayName}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 128px, 160px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-blue-100 text-blue-500 text-4xl font-bold">
              {instructor.name.charAt(0)}
            </div>
          )}
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
          {displayName}
        </h3>
        
        {instructor.title && (
          <p className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full mb-4 inline-block">
            {instructor.title}
          </p>
        )}
      </div>

      {/* Bottom Half: Details & Bio */}
      <div className="px-6 pb-6 flex-grow flex flex-col justify-between">
        <div className="space-y-4 mb-6">
          {/* Tags / Meta */}
          <div className="space-y-2 text-sm text-gray-600">
            {instructor.experience && (
              <div className="flex items-start gap-2">
                <Briefcase className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{instructor.experience}</span>
              </div>
            )}
            {instructor.education && (
              <div className="flex items-start gap-2">
                <GraduationCap className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="line-clamp-1">{instructor.education}</span>
              </div>
            )}
          </div>
          
          {/* Bio Quote (Message to Student) */}
          {instructor.bio && (
            <div className="relative pt-4">
              <span className="absolute top-0 left-0 text-3xl text-gray-200 font-serif leading-none">"</span>
              <p className="text-sm text-gray-500 italic relative z-10 pl-2 line-clamp-3">
                {instructor.bio}
              </p>
            </div>
          )}
        </div>

        {/* Footer info & CTA */}
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div className="text-xs font-medium text-gray-500">
            สอน {instructor._count?.courses || 0} คอร์ส
          </div>
          <div className="text-sm font-bold text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all">
            ดูโปรไฟล์ <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
