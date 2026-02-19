import Image from 'next/image';
import { Instructor } from '@/app/lib/types';
import { ChevronRight } from 'lucide-react';

interface TutorHighlightProps {
    tutors: Instructor[];
}

export default function TutorHighlight({ tutors }: TutorHighlightProps) {
    return (
        <section className="py-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Tutor Highlight</h2>
                <a href="/about" className="text-primary hover:underline text-sm font-semibold flex items-center">
                    ดูทั้งหมด <ChevronRight size={16} />
                </a>
            </div>

            <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {tutors.map((tutor) => (
                    <div key={tutor.id} className="flex flex-col items-center flex-shrink-0 cursor-pointer group">
                        <div className="w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-primary to-blue-300 mb-3 group-hover:scale-105 transition-transform duration-300">
                            <div className="w-full h-full rounded-full border-2 border-white overflow-hidden relative bg-gray-100">
                                {tutor.profileImage ? (
                                    <Image
                                        src={tutor.profileImage}
                                        alt={tutor.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-blue-50 text-primary font-bold text-2xl">
                                        {tutor.name.charAt(0)}
                                    </div>
                                )}
                            </div>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors text-center w-28 truncate">
                            {tutor.nickname || tutor.name.split(' ')[0]}
                        </h3>
                        <p className="text-xs text-gray-500 text-center w-28 truncate">
                            {tutor.title || "Tutor"}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
