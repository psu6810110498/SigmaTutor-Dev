import { Course } from '@/app/lib/types';
import CourseCard from '@/app/components/marketplace/CourseCard';
import { notFound } from 'next/navigation';

// Mock Data (Should be shared or fetched)
// In a real app, this would be a server component fetching from DB
const MOCK_COURSES: Course[] = [
    {
        id: '1', title: 'ฟิสิกส์ ม.ปลาย - กลศาสตร์ 1', slug: 'physics-mech-1', description: 'ปูพื้นฐานกลศาสตร์แน่นปึ้ก',
        shortDescription: 'Short description...',
        price: 5000, promotionalPrice: 1290, originalPrice: 2500, status: 'PUBLISHED', courseType: 'ONLINE',
        thumbnail: null, thumbnailSm: null, thumbnailLg: null,
        categoryId: 'sci', category: { id: 'sci', name: 'วิทยาศาสตร์', slug: 'science' },
        levelId: 'hs', level: null, instructorId: '2', instructor: { id: '2', name: 'Kroo P Ohm', nickname: 'ครูพี่โอม', title: 'Physics Master', profileImage: null },
        duration: '15 ชม.', videoCount: 20, maxSeats: null, enrollStartDate: null, enrollEndDate: null,
        location: null, mapUrl: null, zoomLink: null, published: true,
        isBestSeller: true, createdAt: '', updatedAt: ''
    },
    {
        id: '2', title: 'TCAS English - Grammar Intensive', slug: 'eng-grammar', description: 'สรุป Grammar ทั้งหมดใน 10 ชม.',
        shortDescription: 'Short description...',
        price: 1990, promotionalPrice: 990, originalPrice: 1990, status: 'PUBLISHED', courseType: 'ONLINE',
        thumbnail: null, thumbnailSm: null, thumbnailLg: null,
        categoryId: 'eng', category: { id: 'eng', name: 'ภาษาอังกฤษ', slug: 'english' },
        levelId: 'hs', level: null, instructorId: '1', instructor: { id: '1', name: 'Kroo P Aom', nickname: 'ครูพี่ออม', title: 'English Expert', profileImage: null },
        duration: '10 ชม.', videoCount: 15, maxSeats: null, enrollStartDate: null, enrollEndDate: null,
        location: null, mapUrl: null, zoomLink: null, published: true,
        tags: ['TCAS'], createdAt: '', updatedAt: ''
    }
    // Add more mock data if needed for testing grid
];

// Helper to get category title from logic
const getCategoryTitle = (category: string) => {
    switch (category) {
        case 'tcas': return '🎯 ปั้นคะแนน TCAS ทะลุเป้า';
        case 'hschool': return '⭐ อัปเกรด 4 ม.ปลาย';
        case 'inter': return '🌍 โกอินเตอร์ (SAT/IELTS)';
        case 'middleschool': return '🚀 ปูพื้นฐาน ม.ต้น';
        default: return 'คอร์สทั้งหมด';
    }
}

export default function CategoryPage({ params }: { params: { category: string } }) {
    const { category } = params;
    const title = getCategoryTitle(category);

    // Simple mock filter logic
    const courses = MOCK_COURSES.filter(c => {
        if (category === 'tcas') return c.tags?.includes('TCAS') || c.categoryId === 'sci';
        if (category === 'hschool') return c.categoryId === 'sci';
        if (category === 'inter') return c.categoryId === 'eng';
        return true;
    });

    return (
        <div className="min-h-screen bg-gray-50 font-sans py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
                    <p className="text-gray-500 mt-2">รวมคอร์สคุณภาพที่เราคัดสรรมาเพื่อคุณ</p>
                </div>

                {courses.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {courses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 text-gray-500 bg-white rounded-xl border border-dashed border-gray-200">
                        ไม่พบคอร์สในหมวดหมู่นี้
                    </div>
                )}
            </div>
        </div>
    );
}
