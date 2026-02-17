"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    BookOpen,
    Calendar,
    ChevronLeft,
    Loader2
} from "lucide-react";
import { courseApi } from "@/app/lib/api";
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
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"overview" | "curriculum" | "schedule">("overview");

    useEffect(() => {
        if (!courseId) return;
        const fetchCourse = async () => {
            try {
                const res = await courseApi.getById(courseId);
                if (res.success && res.data) {
                    setCourse(res.data);
                } else {
                    toast.error(res.error || "ไม่พบข้อมูลคอร์ส");
                    router.push("/admin/courses");
                }
            } catch (error) {
                toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
            } finally {
                setLoading(false);
            }
        };
        fetchCourse();
    }, [courseId, router, toast]); // Toast in dep array? safe as long as we don't start looping. 
    // Usually toast is stable or we ignore it. But let's keep it safe.

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!course) return null;

    // Refresh data handler
    const handleRefresh = async () => {
        const res = await courseApi.getById(courseId);
        if (res.success && res.data) setCourse(res.data);
    };

    return (
        <AdminFormLayout
            title={`แก้ไข: ${course.title}`}
            description="จัดการข้อมูล เนื้อหา และตารางเรียน"
            breadcrumbs={[
                { label: 'แดชบอร์ด', href: '/admin' },
                { label: 'จัดการคอร์ส', href: '/admin/courses' },
                { label: course.title, href: '#' }
            ]}
            actions={
                <Link href="/admin/courses">
                    <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium">
                        กลับหน้ารวม
                    </button>
                </Link>
            }
        >
            {/* Tabs Header */}
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
                <TabButton
                    active={activeTab === "overview"}
                    onClick={() => setActiveTab("overview")}
                    icon={LayoutDashboard}
                    label="ข้อมูลทั่วไป"
                />

                {course.courseType === "ONLINE" && (
                    <TabButton
                        active={activeTab === "curriculum"}
                        onClick={() => setActiveTab("curriculum")}
                        icon={BookOpen}
                        label="เนื้อหาบทเรียน"
                    />
                )}

                {(course.courseType === "ONLINE_LIVE" || course.courseType === "ONSITE") && (
                    <TabButton
                        active={activeTab === "schedule"}
                        onClick={() => setActiveTab("schedule")}
                        icon={Calendar}
                        label="ตารางเรียน"
                    />
                )}
            </div>

            {/* Tab Content */}
            <div className="animate-fade-in-up">
                {activeTab === "overview" && (
                    <CourseOverviewTab course={course} onUpdate={handleRefresh} />
                )}
                {activeTab === "curriculum" && <CurriculumTab course={course} onUpdate={handleRefresh} />}
                {activeTab === "schedule" && <ScheduleTab course={course} onUpdate={handleRefresh} />}
            </div>
        </AdminFormLayout>
    );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                ${active
                    ? "border-primary text-primary"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }
            `}
        >
            <Icon size={18} />
            {label}
        </button>
    );
}
