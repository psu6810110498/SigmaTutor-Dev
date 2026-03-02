"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Calendar, Loader2 } from "lucide-react";
import type { Course } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { AdminFormLayout } from "@/app/components/layouts/AdminFormLayout";
import { CourseOverviewTab } from "./tabs/CourseOverviewTab";
import { CurriculumTab } from "./tabs/CurriculumTab";
import { ScheduleTab } from "./tabs/ScheduleTab";

export default function EditCoursePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const courseId = params?.id as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [instructors, setInstructors] = useState<any[]>([]); // ✅ เพิ่ม State เก็บรายชื่อครู
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "schedule">("overview");

    const fetchData = async () => {
        setLoading(true);
        try {
            const headers = {
                'Content-Type': 'application/json'
            };

            // 1. ดึงข้อมูลคอร์ส
            const courseRes = await fetch(`http://localhost:4000/api/courses/${courseId}`, { headers, credentials: 'include' });
            const courseData = await courseRes.json();

            // 2. ดึงรายชื่อคุณครู (เหมือนหน้าสร้าง)
            const instRes = await fetch(`http://localhost:4000/api/users/instructors`, { headers, credentials: 'include' });
            const instData = await instRes.json();

            if (courseData.success) {
                setCourse(courseData.data);
            } else {
                toast.error("ไม่พบข้อมูลคอร์ส");
                router.push("/admin/courses");
            }

            if (instData.success) {
                setInstructors(instData.data);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) fetchData();
    }, [courseId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
    if (!course) return null;

    return (
        <AdminFormLayout
            title={`แก้ไข: ${course.title}`}
            description="จัดการข้อมูล เนื้อหา และตารางเรียน"
            breadcrumbs={[
                { label: 'แดชบอร์ด', href: '/admin' },
                { label: 'จัดการคอร์ส', href: '/admin/courses' },
                { label: course.title, href: '#' }
            ]}
            actions={<Link href="/admin/courses"><button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">กลับหน้ารวม</button></Link>}
        >
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutDashboard} label="ข้อมูลทั่วไป" />
                {course.courseType === "ONLINE" && <TabButton active={activeTab === "curriculum"} onClick={() => setActiveTab("curriculum")} icon={BookOpen} label="เนื้อหาบทเรียน" />}
                {(course.courseType === "ONLINE_LIVE" || course.courseType === "ONSITE") && <TabButton active={activeTab === "schedule"} onClick={() => setActiveTab("schedule")} icon={Calendar} label="ตารางเรียน" />}
            </div>

            <div className="animate-fade-in-up">
                {activeTab === "overview" && (
                    <CourseOverviewTab
                        course={course}
                        instructors={instructors} // ✅ ส่งรายชื่อครูไปที่ Tab
                        onUpdate={fetchData}
                    />
                )}
                {activeTab === "curriculum" && <CurriculumTab course={course} onUpdate={fetchData} />}
                {activeTab === "schedule" && <ScheduleTab course={course} onUpdate={fetchData} />}
            </div>
        </AdminFormLayout>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${active ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
            <Icon size={18} /> {label}
        </button>
    );
}