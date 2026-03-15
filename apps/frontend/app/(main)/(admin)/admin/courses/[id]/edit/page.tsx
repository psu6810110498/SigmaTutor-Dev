"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BookOpen, Calendar, Loader2 } from "lucide-react";
import type { Course } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { AdminFormLayout } from "@/app/components/layouts/AdminFormLayout";
import { CourseOverviewTab } from "./tabs/CourseOverviewTab";
import { LessonsTab } from "./tabs/LessonsTab";
import { LiveScheduleTab } from "./tabs/LiveScheduleTab";
import { OnsiteScheduleTab } from "./tabs/OnsiteScheduleTab";

import { courseApi, userApi } from "@/app/lib/api";

export default function EditCoursePage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const courseId = params?.id as string;

    const [course, setCourse] = useState<Course | null>(null);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // ✅ เหลือแค่ overview กับ schedule
    const [activeTab, setActiveTab] = useState<"overview" | "schedule">("overview");

    const fetchData = async () => {
        if (!courseId) return;
        setLoading(true);
        try {
            const [courseRes, instRes] = await Promise.all([
                courseApi.getById(courseId),
                userApi.list()
            ]);

            if (courseRes.success && courseRes.data) {
                setCourse(courseRes.data);
            } else {
                toast.error(courseRes.error || "ไม่พบข้อมูลคอร์ส");
                router.push("/admin/courses");
            }

            if (instRes.success && instRes.data) {
                setInstructors(instRes.data);
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
            title="แก้ไขคอร์สเรียน 🛠️"
            description={`กำลังปรับปรุงข้อมูลสำหรับ: ${course.title}`}
            breadcrumbs={[
                { label: 'แดชบอร์ด', href: '/admin' },
                { label: 'จัดการคอร์ส', href: '/admin/courses' },
                { label: course.title, href: '#' }
            ]}
            actions={<Link href="/admin/courses"><button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">กลับหน้ารวม</button></Link>}
        >
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutDashboard} label="ข้อมูลทั่วไป" />
                
                {/* ✅ ใช้ปุ่มเดียวสำหรับบทเรียน แต่เปลี่ยนชื่อและไอคอนตามประเภทคอร์ส */}
                <TabButton 
                    active={activeTab === "schedule"} 
                    onClick={() => setActiveTab("schedule")} 
                    icon={course.courseType === "ONLINE" ? BookOpen : Calendar} 
                    label={course.courseType === "ONLINE" ? "เนื้อหาบทเรียน" : "ตารางเรียน"} 
                />
            </div>

            <div className="animate-fade-in-up">
                {activeTab === "overview" && (
                    <CourseOverviewTab
                        course={course}
                        instructors={instructors}
                        onUpdate={fetchData}
                    />
                )}
                {activeTab === "schedule" && course.courseType === "ONLINE" && (
                    <LessonsTab course={course} onUpdate={fetchData} />
                )}
                {activeTab === "schedule" && course.courseType === "ONLINE_LIVE" && (
                    <LiveScheduleTab course={course} onUpdate={fetchData} />
                )}
                {activeTab === "schedule" && course.courseType === "ONSITE" && (
                    <OnsiteScheduleTab course={course} onUpdate={fetchData} />
                )}
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